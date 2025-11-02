import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "系统说明 - 家庭理财框架与管理系统",
  description: "全面了解家庭理财框架与管理系统的核心指标、功能架构和使用方法",
};

export default function AboutPage() {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">家庭理财框架与管理系统</h1>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2">
          1. 核心财务指标
        </h2>

        <div className="mb-8">
          <h3 className="text-xl font-medium mb-3">1.1 现金流管理</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg overflow-hidden">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">指标</th>
                  <th className="px-4 py-2 text-left">计算公式</th>
                  <th className="px-4 py-2 text-left">健康标准</th>
                  <th className="px-4 py-2 text-left">分析要点</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-4 py-2">月收入</td>
                  <td className="px-4 py-2">-</td>
                  <td className="px-4 py-2">稳定增长</td>
                  <td className="px-4 py-2">主要收入来源及稳定性</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-4 py-2">月支出</td>
                  <td className="px-4 py-2">-</td>
                  <td className="px-4 py-2">控制在预算内</td>
                  <td className="px-4 py-2">主要支出类别及优化空间</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-medium">储蓄率</td>
                  <td className="px-4 py-2">(月收入 - 月支出) / 月收入</td>
                  <td className="px-4 py-2">10-20% 健康区</td>
                  <td className="px-4 py-2">反映财务健康状况</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-xl font-medium mb-3">1.2 资产健康状况</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg overflow-hidden">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">指标</th>
                  <th className="px-4 py-2 text-left">计算公式</th>
                  <th className="px-4 py-2 text-left">健康标准</th>
                  <th className="px-4 py-2 text-left">分析要点</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-4 py-2">净资产</td>
                  <td className="px-4 py-2">总资产 - 总负债</td>
                  <td className="px-4 py-2">持续增长</td>
                  <td className="px-4 py-2">资产增长质量与可持续性</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-4 py-2">投资资产比率</td>
                  <td className="px-4 py-2">投资资产 / 总资产</td>
                  <td className="px-4 py-2">≥50% 目标</td>
                  <td className="px-4 py-2">资产配置合理性</td>
                </tr>
                <tr>
                  <td className="px-4 py-2">流动性比率</td>
                  <td className="px-4 py-2">流动性资产 / 月支出</td>
                  <td className="px-4 py-2">3-6个月</td>
                  <td className="px-4 py-2">应急能力评估</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-4 py-2">财务自由度</td>
                  <td className="px-4 py-2">
                    (投资资产 × 年化收益率) / 年支出
                  </td>
                  <td className="px-4 py-2">≥100% 财务自由</td>
                  <td className="px-4 py-2">被动收入覆盖生活支出的能力</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2">
          2. 家庭财务文化建设
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-medium mb-3">2.1 定期家庭财务会议</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <span className="font-medium">频率：</span>每月一次
              </li>
              <li>
                <span className="font-medium">参与人员：</span>全体家庭成员
              </li>
              <li>
                <span className="font-medium">议程：</span>
              </li>
              <ol className="list-decimal pl-5 mt-1 space-y-1">
                <li>回顾上月收支情况</li>
                <li>检查预算执行情况</li>
                <li>讨论大额支出计划</li>
                <li>调整财务目标与策略</li>
                <li>学习理财知识（每月一个主题）</li>
              </ol>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-medium mb-3">2.2 财务目标设定</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">短期目标（1年内）</h4>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>建立应急基金</li>
                  <li>偿还高息债务</li>
                  <li>完成保险配置</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium">中期目标（1-5年）</h4>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>购房首付</li>
                  <li>子女教育金储备</li>
                  <li>职业发展投资</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium">长期目标（5年以上）</h4>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>退休规划</li>
                  <li>财富传承</li>
                  <li>实现财务自由</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2">
          3. 应急基金体系
        </h2>

        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-2">第一层：基础应急金</h3>
            <ul className="space-y-1 text-sm">
              <li>
                💰 <span className="font-medium">金额：</span>3个月基本生活费
              </li>
              <li>
                🏦 <span className="font-medium">存放：</span>活期存款、货币基金
              </li>
              <li>
                🎯 <span className="font-medium">用途：</span>日常应急、临时支出
              </li>
            </ul>
          </div>

          <div className="bg-green-50 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-2">第二层：中期储备金</h3>
            <ul className="space-y-1 text-sm">
              <li>
                💰 <span className="font-medium">金额：</span>3-6个月生活费
              </li>
              <li>
                🏦 <span className="font-medium">存放：</span>
                短期理财产品、债券基金
              </li>
              <li>
                🎯 <span className="font-medium">用途：</span>
                失业、医疗等突发事件
              </li>
            </ul>
          </div>

          <div className="bg-purple-50 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-2">第三层：长期安全垫</h3>
            <ul className="space-y-1 text-sm">
              <li>
                💰 <span className="font-medium">金额：</span>1年以上生活费
              </li>
              <li>
                🏦 <span className="font-medium">存放：</span>稳健型投资组合
              </li>
              <li>
                🎯 <span className="font-medium">用途：</span>
                经济危机、长期失业等极端情况
              </li>
            </ul>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-medium mb-3">应急基金使用原则</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>专款专用，非紧急不动用</li>
            <li>使用后及时补充</li>
            <li>定期评估调整金额</li>
          </ul>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2">
          4. 收入多元化策略
        </h2>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-medium mb-3">4.1 收入来源规划</h3>

            <div className="mb-4">
              <h4 className="font-medium">主动收入</h4>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>主要工作</li>
                <li>副业/兼职</li>
                <li>自由职业</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium">被动收入</h4>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>投资理财收益</li>
                <li>租金收入</li>
                <li>知识产权收益</li>
                <li>数字资产收益</li>
              </ul>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-medium mb-3">4.2 收入多元化目标</h3>
            <ul className="space-y-4">
              <li className="flex items-start">
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full mr-3">
                  3年
                </span>
                <span>被动收入占比达到20%</span>
              </li>
              <li className="flex items-start">
                <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full mr-3">
                  5年
                </span>
                <span>建立3个以上稳定收入来源</span>
              </li>
              <li className="flex items-start">
                <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full mr-3">
                  10年
                </span>
                <span>实现财务自由（被动收入 ≥ 生活支出）</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2">
          5. 保险保障规划
        </h2>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-medium mb-3">5.1 必备保险配置</h3>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium">1. 寿险</h4>
                <ul className="text-sm text-gray-600 mt-1 space-y-1">
                  <li>• 保额：年收入5-10倍</li>
                  <li>• 期限：至主要责任期结束</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium">2. 重疾险</h4>
                <ul className="text-sm text-gray-600 mt-1 space-y-1">
                  <li>• 保额：年收入3-5倍</li>
                  <li>• 覆盖：常见重疾+轻症</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium">3. 医疗险</h4>
                <ul className="text-sm text-gray-600 mt-1 space-y-1">
                  <li>• 百万医疗险：覆盖大额医疗支出</li>
                  <li>• 中高端医疗：提升就医体验</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium">4. 意外险</h4>
                <ul className="text-sm text-gray-600 mt-1 space-y-1">
                  <li>• 综合意外：覆盖意外身故/伤残</li>
                  <li>• 交通意外：加强特定场景保障</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-medium mb-3">5.2 保险配置原则</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full mr-3">
                  原则一
                </span>
                <span>先保障后理财</span>
              </li>
              <li className="flex items-start">
                <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full mr-3">
                  原则二
                </span>
                <span>先大人后小孩</span>
              </li>
              <li className="flex items-start">
                <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full mr-3">
                  原则三
                </span>
                <span>先保额后期限</span>
              </li>
              <li className="flex items-start">
                <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full mr-3">
                  原则四
                </span>
                <span>定期检视调整</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2">
          6. 投资理财框架
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-medium mb-3">6.1 资产配置策略</h3>
            <ul className="space-y-2">
              <li className="flex justify-between">
                <span>现金类：</span>
                <span className="font-medium">5-10%</span>
              </li>
              <li className="flex justify-between">
                <span>固定收益类：</span>
                <span className="font-medium">20-40%</span>
              </li>
              <li className="flex justify-between">
                <span>权益类：</span>
                <span className="font-medium">40-60%</span>
              </li>
              <li className="flex justify-between">
                <span>另类投资：</span>
                <span className="font-medium">5-15%</span>
              </li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-medium mb-3">6.2 投资原则</h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>长期投资，避免短期投机</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>分散投资，降低风险</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>定期再平衡，维持目标配置</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>费用最小化，提高净收益</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2">
          7. 定期检视与调整
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-medium mb-3">7.1 检视频率</h3>
            <ul className="space-y-3">
              <li>
                <span className="font-medium">每月：</span>
                <span>现金流与预算执行</span>
              </li>
              <li>
                <span className="font-medium">每季：</span>
                <span>投资组合再平衡</span>
              </li>
              <li>
                <span className="font-medium">每年：</span>
                <span>全面财务体检</span>
              </li>
              <li>
                <span className="font-medium">重大事件：</span>
                <span>及时调整规划</span>
              </li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-medium mb-3">7.2 调整原则</h3>
            <ul className="space-y-2">
              <li>• 根据生命周期调整风险承受能力</li>
              <li>• 根据市场环境调整资产配置</li>
              <li>• 根据家庭情况调整财务目标</li>
              <li>• 根据政策变化调整税务规划</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2">
          8. 系统功能架构
        </h2>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">前端界面</h3>
              <ul className="space-y-1 text-sm">
                <li>• 仪表盘</li>
                <li>• 交易记录</li>
                <li>• 统计分析</li>
                <li>• 预算管理</li>
                <li>• 资产管理</li>
              </ul>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">核心功能</h3>
              <ul className="space-y-1 text-sm">
                <li>• 现金流分析</li>
                <li>• 资产净值计算</li>
                <li>• 交易管理</li>
                <li>• 预算追踪</li>
                <li>• 投资组合分析</li>
              </ul>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">数据层</h3>
              <ul className="space-y-1 text-sm">
                <li>• 交易数据</li>
                <li>• 资产数据</li>
                <li>• 预算数据</li>
                <li>• 用户配置</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
