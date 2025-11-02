import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "新手指南 - 财务管理系统",
  description: "财务管理系统新手指南，帮助您快速开始使用系统",
};

export default function GuidePage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">🚀 快速开始指南</h1>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">
          第一步：基础设置（第1周）
        </h2>
        <div className="ml-6 space-y-4">
          <div>
            <h3 className="text-lg font-medium">1. 创建财务快照</h3>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>记录当前所有资产（现金、存款、投资等）</li>
              <li>列出所有负债（贷款、信用卡等）</li>
              <li>计算当前净资产（资产 - 负债）</li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-medium">2. 设置基础账户</h3>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>开设专用银行账户用于日常开支</li>
              <li>设置自动转账到储蓄账户</li>
              <li>下载并连接常用的银行/支付应用</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">
          第二步：建立预算（第2-3周）
        </h2>
        <div className="ml-6 space-y-4">
          <div>
            <h3 className="text-lg font-medium">1. 追踪30天支出</h3>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>记录每一笔支出</li>
              <li>按类别分类（餐饮、交通、娱乐等）</li>
              <li>使用预算管理工具或电子表格</li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-medium">2. 制定第一个预算</h3>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>设定合理的支出限额</li>
              <li>确定固定支出和可调整支出</li>
              <li>预留应急资金</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">📱 账单导出指南</h2>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-xl font-semibold mb-3">支付宝账单导出步骤</h3>
          <div className="space-y-2">
            <p className="font-medium">手机端导出：</p>
            <ol className="list-decimal ml-6 space-y-1">
              <li>打开支付宝App → 我的 → 账单</li>
              <li>点击右上角&quot;...&quot; → 开具交易流水证明</li>
              <li>
                选择&quot;用于个人对账&quot; → 选择时间范围（建议按月导出）
              </li>
              <li>填写接收邮箱 → 点击&quot;发送&quot;</li>
            </ol>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-xl font-semibold mb-3">微信账单导出步骤</h3>
          <div className="space-y-2">
            <p className="font-medium">手机端导出：</p>
            <ol className="list-decimal ml-6 space-y-1">
              <li>打开微信 → 我 → 服务 → 钱包</li>
              <li>点击&quot;客服中心&quot; → 账单下载</li>
              <li>选择&quot;用于个人对账&quot; → 选择时间范围</li>
              <li>填写邮箱地址 → 确认发送</li>
            </ol>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-xl font-semibold mb-3">导入系统说明</h3>
          <ol className="list-decimal ml-6 space-y-1">
            <li>登录系统 → 右上角</li>
            <li>点击&quot;导入&quot; → 选择对应的账单文件</li>
            <li>系统自动识别并匹配交易类别</li>
            <li>确认导入 → 完成</li>
          </ol>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">💡 实用小贴士</h2>
        <div className="bg-yellow-50 p-6 rounded-lg">
          <ul className="list-disc ml-6 space-y-2">
            <li>
              使用&quot;50/30/20&quot;法则开始：
              <ul className="list-disc ml-6 mt-1">
                <li>50% 必要支出</li>
                <li>30% 非必要支出</li>
                <li>20% 储蓄与投资</li>
              </ul>
            </li>
            <li>每月固定时间进行财务回顾</li>
            <li>设置财务目标（短期、中期、长期）</li>
          </ul>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">❓ 常见问题</h2>
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-medium">Q: 应该先还债还是先存钱？</h3>
            <p className="mt-2 text-gray-700">
              A:
              建议先存够1个月应急资金，然后集中还高息债务，最后再增加应急资金到3-6个月。
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-medium">Q: 每月应该存多少钱？</h3>
            <p className="mt-2 text-gray-700">
              A: 建议至少收入的20%，如果暂时达不到，可以从10%开始逐步提高。
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-medium">Q: 系统支持哪些文件格式导入？</h3>
            <p className="mt-2 text-gray-700">
              A:
              系统支持Excel/CSV格式文件，建议使用支付宝/微信导出的原始文件直接导入。
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
