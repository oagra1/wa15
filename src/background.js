import { guid } from '@/utils/uuid-util'
import { dealLog } from '@/utils/log-util'

import {
  setInstallTime,
  updateSetInstallTime
} from 'zbase-popup-component/src/zbase/popup/utils/installTime'
import { WAPLUS_REMOVE_FLAG, openInstallUrl } from '@/utils/extension-util'

import 'webext-bridge/dist/background'
import { Z_BASE_CONFIG_URL } from '@/service/common.js'
import { MIGRATION_SIMPLE_FLOW } from '@/service/constants'

// 消息传递js
import '@/background/bridge-background'

/**
 * @description: 获取插件配置，添加5分钟缓存机制，减少OSS访问次数
 * @return {*}
 */
function getConfig() {
  // 检查是否有缓存的配置和时间戳
  chrome.storage.local.get(['zbaseConfig', 'configLastFetchTime'], (result) => {
    const currentTime = Date.now()
    const fiveMinutes = 5 * 60 * 1000 // 5分钟的毫秒数

    // 如果没有配置或者距离上次获取超过5分钟，则重新获取
    if (
      !result.zbaseConfig ||
      !result.configLastFetchTime ||
      currentTime - result.configLastFetchTime > fiveMinutes
    ) {
      fetch(Z_BASE_CONFIG_URL, {
        cache: 'no-store'
      })
        .then((response) => response.json())
        .then((data) => {
          // 保存配置和当前时间戳
          chrome.storage.local
            .set({
              zbaseConfig: data,
              configLastFetchTime: currentTime
            })
            .then()
        })
        .catch((error) => {
          console.log('获取配置时出错', error)
          // 如果获取失败但有旧配置，继续使用旧配置
          if (result.zbaseConfig) {
            console.log('使用缓存的配置')
          }
        })
    } else {
      console.log(
        '使用缓存的配置，距离上次获取时间：',
        Math.round((currentTime - result.configLastFetchTime) / 1000),
        '秒'
      )
    }
  })
}

try {
  if (chrome && chrome.storage && chrome.storage.local && chrome.storage.local.set) {
    const maybePromise = chrome.storage.local.set({ MIGRATION_SIMPLE_FLOW })
    if (maybePromise && typeof maybePromise.catch === 'function') {
      maybePromise.catch(() => {})
    }
  }
} catch (error) {
  console.error('[MIG] persist MIGRATION_SIMPLE_FLOW failed', error)
}

chrome.runtime.onMessage.addListener(function (data) {
  //处理阿里云日志
  if (data.type === 'log') {
    dealLog(data)
  }

  // 处理make-order请求
  if (data.type === 'makeOrder') {
    if (MIGRATION_SIMPLE_FLOW) {
      chrome.runtime.sendMessage({
        type: 'makeOrderResponse',
        error: 'External checkout flow in use. Open /planos.'
      })
      return true
    }
    const { requestObj } = data

    // const PAY_URL = 'https://sender.watechdev.asia/api/pay/make-order' // 测试
    const PAY_URL = 'https://wawebsender.com/api/pay/make-order' // 生产

    // 在background script中发起请求，避免CORS问题
    fetch(PAY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestObj)
    })
      .then((response) => response.json())
      .then((result) => {
        // 使用sendResponse返回成功结果
        // sendResponse(result)
        chrome.runtime.sendMessage({ type: 'makeOrderResponse', data: result })
      })
      .catch((error) => {
        // 使用sendResponse返回错误
        // sendResponse({ error: error.message })
        chrome.runtime.sendMessage({ type: 'makeOrderResponse', error: error.message })
      })

    return true // 保持消息通道开放
  }
})
chrome.runtime.onInstalled.addListener((details) => {
  //如果用户之前没有邀评，需要加上邀评记录时间
  chrome.storage.local.get(['inviteCommentTime', 'uuid', 'version', 'zbaseConfig'], function (res) {
    console.log('安装后的数据')
    console.log(res)
    if (!res.inviteCommentTime) {
      chrome.storage.local.set({ inviteCommentTime: Math.round(new Date() / 1000) }).then((r) => {})
    }
    let uuid = res.uuid !== undefined ? res.uuid : guid()
    let version = res.version !== undefined ? res.version : chrome.runtime.getManifest().version
    let installTime = Math.round(new Date() / 1000)
    if (details.reason === 'install') {
      if (!WAPLUS_REMOVE_FLAG) {
        // loadZbaseConfigToStorage(EXTENSION_ID, Z_BASE_CONFIG_URL)
        getConfig()
      }
      // 从组件中引入的
      setInstallTime(installTime)
      chrome.storage.local
        .set({ installTime, uuid, version, installLogFlag: false })
        .then((r) => {})
      dealLog({ type: 'log', eventType: 900008, otherParams: { uuid, version } })
      openInstallUrl()
    } else if (details.reason === 'update') {
      chrome.storage.local.get(['zbaseConfig', 'phoneNum'], (res) => {
        const zbaseConfig = res.zbaseConfig.data.config
        const phoneNum = res.phoneNum
        if (zbaseConfig && phoneNum) {
          for (let i = 0; i < zbaseConfig.length; i++) {
            if (zbaseConfig[i].name === 'WAPI Paid User') {
              const paid_number_list = zbaseConfig[i].params.paid_list
              if (paid_number_list.indexOf(phoneNum)) {
                chrome.storage.local.set({ paid_mark: true })
              }
            }
          }
        }
      })
      updateSetInstallTime(installTime)
      if (!WAPLUS_REMOVE_FLAG) {
        // loadZbaseConfigToStorage(EXTENSION_ID, Z_BASE_CONFIG_URL)
        getConfig()
      }
    }
  })
})
