import { checkRealtimeRules } from './rules'

describe('checkRealtimeRules', () => {
  test('通过正常回答', () => {
    const result = checkRealtimeRules(
      '网络连接 打印机 无法 使用',
      '网络连接正常时，打印机可以正常使用，请检查网络设置和打印机连接',
      0.8
    )
    expect(result.passed).toBe(true)
    expect(result.failReasons).toHaveLength(0)
  })

  test('置信度过低应失败', () => {
    const result = checkRealtimeRules(
      '电脑无法开机怎么办',
      '请先检查电脑电源线是否连接正常，尝试重启电脑解决',
      0.3
    )
    expect(result.passed).toBe(false)
    expect(result.failReasons).toContain('置信度过低: 0.3 < 0.5')
    expect(result.scores.confidenceScore).toBeLessThan(1.0)
  })

  test('回答过短应失败', () => {
    const result = checkRealtimeRules(
      '电脑无法开机怎么办',
      '检查电源',
      0.8
    )
    expect(result.passed).toBe(false)
    expect(result.failReasons).toContain('回答过短: 4 < 30字符')
    expect(result.scores.lengthScore).toBeLessThan(1.0)
  })

  test('回答过长应失败', () => {
    const longAnswer = '请检查电脑设置和配置，解决网络连接问题，安装最新的驱动程序，更新系统补丁，重置网络适配器，重启路由器和交换机。'.repeat(55)
    const result = checkRealtimeRules(
      '电脑无法上网怎么办',
      longAnswer,
      0.8
    )
    expect(result.passed).toBe(false)
    expect(result.failReasons.some(r => r.includes('回答过长'))).toBe(true)
  })

  test('关键词覆盖不足应失败', () => {
    const result = checkRealtimeRules(
      '打印机无法连接网络',
      '请稍等片刻。',
      0.8
    )
    expect(result.passed).toBe(false)
    expect(result.failReasons.some(r => r.includes('关键词覆盖不足'))).toBe(true)
  })

  test('低置信度回答缺少IT支持必要提示应失败', () => {
    const result = checkRealtimeRules(
      '电脑无法开机怎么办',
      '可能是电源问题。',
      0.6
    )
    expect(result.passed).toBe(false)
    expect(result.failReasons).toContain('低置信度回答缺少IT支持必要提示')
  })
})