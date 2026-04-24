import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

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
  const content = fs.readFileSync(datasetFile, 'utf-8')

  // 提取JSON代码块
  const jsonMatches = content.match(/```json\n([\s\S]*?)\n```/g)

  if (!jsonMatches) {
    console.error('No JSON data found in evaluation dataset')
    return
  }

  // 创建数据集记录
  const dataset = await prisma.evaluationDataset.create({
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
      await prisma.evaluationItem.create({
        data: {
          datasetId: dataset.id,
          question: item.question,
          category: item.category,
          subcategory: item.subcategory,
          difficulty: item.difficulty,
          questionType: item.question_type,
          expectedKeyPoints: JSON.stringify(item.expected_key_points),
          sourceDoc: item.source_doc,
          sourceSection: item.source_section
        }
      })
      importCount++
    }
  }

  console.log(`Imported ${importCount} evaluation items into dataset ${dataset.id}`)
}

importDataset()
  .catch(console.error)
  .finally(() => prisma.$disconnect())