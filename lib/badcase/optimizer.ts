import { prisma } from '@/lib/prisma'

export interface OptimizationTaskInput {
  badcaseId: string
  taskType: 'add_knowledge' | 'update_prompt' | 'merge_cases'
  description: string
}

export async function createOptimizationTask(input: OptimizationTaskInput): Promise<string> {
  const task = await prisma.optimizationTask.create({
    data: {
      badcaseId: input.badcaseId,
      taskType: input.taskType,
      description: input.description,
      status: 'pending'
    }
  })

  console.log(`Optimization task created: ${task.id}`)
  return task.id
}

export async function completeOptimizationTask(taskId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // First find the task to get badcaseId
    const task = await tx.optimizationTask.findUnique({
      where: { id: taskId }
    })

    if (!task) {
      throw new Error(`Optimization task not found: ${taskId}`)
    }

    // Update task status
    await tx.optimizationTask.update({
      where: { id: taskId },
      data: {
        status: 'completed',
        completedAt: new Date()
      }
    })

    // Update badcase status
    await tx.badcase.update({
      where: { id: task.badcaseId },
      data: {
        status: 'optimized',
        optimizedAt: new Date()
      }
    })
  })
}

export async function suggestOptimization(badcaseId: string): Promise<OptimizationTaskInput | null> {
  const badcase = await prisma.badcase.findUnique({
    where: { id: badcaseId }
  })

  if (!badcase || !badcase.category) {
    return null
  }

  switch (badcase.category) {
    case 'knowledge':
      return {
        badcaseId,
        taskType: 'add_knowledge',
        description: `请在知识库中添加关于"${badcase.question}"的相关内容`
      }
    case 'retrieval':
      return {
        badcaseId,
        taskType: 'add_knowledge',
        description: `请补充/优化知识库中关于"${badcase.question}"的内容，提升检索相关性`
      }
    case 'answer':
      return {
        badcaseId,
        taskType: 'update_prompt',
        description: `请优化 AI 回答"${badcase.question}"的 Prompt，减少回答错误`
      }
    default:
      return null
  }
}

export async function getOptimizationTasks(
  badcaseId: string
): Promise<ReturnType<typeof prisma.optimizationTask.findMany> extends Promise<infer T> ? T : never> {
  return prisma.optimizationTask.findMany({
    where: { badcaseId },
    orderBy: { createdAt: 'desc' }
  })
}