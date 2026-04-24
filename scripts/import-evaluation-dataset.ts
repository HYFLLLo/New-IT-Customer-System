import { prisma } from '@/lib/prisma'
import * as fs from 'fs/promises'
import * as path from 'path'

interface EvaluationDataItem {
  id: string
  category: string
  subcategory: string
  difficulty: string
  question_type: string
  question: string
  expected_key_points: string[]
  source_doc: string
  source_section: string
}

async function importDataset() {
  const datasetFile = path.join(process.cwd(), 'docs/evaluation-dataset.md')
  const content = await fs.readFile(datasetFile, 'utf-8')

  // 提取JSON代码块
  const jsonMatches = content.match(/```json\n([\s\S]*?)\n```/g)

  if (!jsonMatches) {
    console.error('No JSON data found in evaluation dataset')
    return
  }

  // Use transaction to ensure atomicity
  const result = await prisma.$transaction(async (tx) => {
    // 创建数据集记录
    const dataset = await tx.evaluationDataset.create({
      data: {
        name: 'IT Helpdesk评测数据集 v1.0',
        description: '基于知识库模拟生成的种子评测数据',
        version: 'v1.0'
      }
    })

    let importCount = 0

    for (const match of jsonMatches) {
      const jsonStr = match.replace(/```json\n?/, '').replace(/\n?```/, '')
      const items: EvaluationDataItem[] = JSON.parse(jsonStr)

      for (const item of items) {
        await tx.evaluationItem.create({
          data: {
            datasetId: dataset.id,
            question: item.question,
            category: item.category || 'Unknown',
            subcategory: item.subcategory || 'Unknown',
            difficulty: item.difficulty || 'medium',
            questionType: item.question_type || 'factual',
            expectedKeyPoints: JSON.stringify(item.expected_key_points || []),
            sourceDoc: item.source_doc || 'Unknown',
            sourceSection: item.source_section || 'Unknown'
          }
        })
        importCount++
      }
    }

    return { datasetId: dataset.id, importCount }
  })

  console.log(`Imported ${result.importCount} evaluation items into dataset ${result.datasetId}`)
}

importDataset()
  .catch(console.error)
  .finally(() => prisma.$disconnect())