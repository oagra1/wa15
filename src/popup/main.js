import Vue from 'vue'
import App from './Main.vue'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import VueI18n from 'vue-i18n'
import { ZbaseCustomPopupDialog } from 'zbase-popup-component/src/zbase/popup/components/zbase-custom'

import { sendLog, dealLog } from '@/utils/log-util' //发送日志函数
import { checkDailySendNums } from '@/utils/daily-send-num-util'
import messages from '@/popup/messages'
import { sendMessage, onMessage } from 'webext-bridge/dist/popup'
import { STORAGE_ACTIVATION_FLAG } from '@/service/constants'
Vue.prototype.$sendLog = sendLog
Vue.prototype.$dealLog = dealLog
Vue.prototype.$checkDailySendNums = checkDailySendNums
Vue.prototype.$bridge = { sendMessage, onMessage }
Vue.use(ElementUI)
Vue.use(VueI18n)
Vue.use(ZbaseCustomPopupDialog)

// Failsafe: se já está ativado, garanta que a UI antiga enxerga "Pro"
try {
  chrome?.storage?.local?.get?.([STORAGE_ACTIVATION_FLAG, 'paid_mark', 'permissionInfo'], (r = {}) => {
    if (r?.[STORAGE_ACTIVATION_FLAG] && (!r?.paid_mark || !r?.permissionInfo)) {
      const patch = { paid_mark: true }
      if (!r?.permissionInfo) {
        patch.permissionInfo = { status: 'active', source: 'supabase', activated_at: Date.now() }
      }
      chrome?.storage?.local?.set?.(patch, () => {})
    }
  })
} catch (e) {
  // não bloquear boot do popup por falha no storage
  console?.warn?.('[popup-failsafe]', e)
}

const appStart = async () => {
  let locale = window.navigator.language || 'en'
  try {
    let storeLang = await chrome.storage.local.get(['locale'])
    locale = storeLang.locale || locale
  } catch (error) {
    console.log('error', error)
  }

  const i18n = new VueI18n({
    locale: locale,
    messages
  })

  const I18nData = [
    {
      code: 'en',
      name: 'English'
    },
    {
      code: 'zh',
      name: '中文'
    },
    {
      code: 'pt',
      name: 'Português'
    },
    {
      code: 'es',
      name: 'Español'
    },
    {
      code: 'ar',
      name: 'العربية'
    }
  ]
  Vue.prototype.$I18nData = I18nData
  /* eslint-disable no-new */
  new Vue({
    i18n,
    el: '#app',
    render: (h) => h(App)
  })

}


appStart()