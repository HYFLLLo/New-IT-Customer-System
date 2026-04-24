import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { embedTexts } from '@/lib/minimax'

type Badcase = Prisma.BadcaseGetPayload<{}>

export interface BadcaseCluster {
  representative: Badcase
  similarCases: Badcase[]
  similarity: number
}

export async function clusterSimilarBadcases(
  threshold: number = 0.85
): Promise<BadcaseCluster[]> {
  const pendingBadcases = await prisma.badcase.findMany({
    where: {
      status: 'pending',
      category: 'knowledge'
    }
  })

  if (pendingBadcases.length < 2) {
    return []
  }

  // 获取所有问题的 embedding
  const questions = pendingBadcases.map(b => b.question)
  const embeddings = await embedTexts(questions)

  // 计算相似度矩阵并进行聚类
  const clusters: BadcaseCluster[] = []
  const used = new Set<string>()

  for (let i = 0; i < pendingBadcases.length; i++) {
    if (used.has(pendingBadcases[i].id)) continue

    const cluster: Badcase[] = [pendingBadcases[i]]
    used.add(pendingBadcases[i].id)

    for (let j = i + 1; j < pendingBadcases.length; j++) {
      if (used.has(pendingBadcases[j].id)) continue

      const similarity = cosineSimilarity(embeddings[i], embeddings[j])
      if (similarity >= threshold) {
        cluster.push(pendingBadcases[j])
        used.add(pendingBadcases[j].id)
      }
    }

    if (cluster.length > 1) {
      clusters.push({
        representative: cluster[0],
        similarCases: cluster.slice(1),
        similarity: threshold
      })
    }
  }

  return clusters
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

export async function createClusterTask(cluster: BadcaseCluster): Promise<string> {
  const task = await prisma.optimizationTask.create({
    data: {
      badcaseId: cluster.representative.id,
      taskType: 'merge_cases',
      description: `批量优化 ${cluster.similarCases.length + 1} 个相似问题：` +
        cluster.similarCases.map(c => c.question).join('; '),
      status: 'pending'
    }
  })

  return task.id
}