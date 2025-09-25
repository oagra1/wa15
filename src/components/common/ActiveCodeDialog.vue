<template>
  <el-dialog
    :visible.sync="isShowActiveCode"
    width="459px"
    top="120px"
    custom-class="activeCodeDialog"
    :modal-append-to-body="false"
    :show-close="false"
    :close-on-click-modal="true"
    @close="closeActiveCodePopup"
    center
    title="Please Enter Active Code"
  >
    <div class="codeInput">
      <el-input class="active-code" v-model="codeStr" placeholder="license key"></el-input>
      <div class="alertLanguage" style="padding-top: 10px">{{ languageVal }}</div>

      <div class="tip-div">
        <svg class="icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="18" height="18">
          <path fill="red" d="M512 128c212.064 0 384 171.936 384 384s-171.936 384-384 384S128 724.064 128 512 299.936 128 512 128z m0 64C335.264 192 192 335.264 192 512s143.264 320 320 320 320-143.264 320-320S688.736 192 512 192z m32 480v64h-64v-64h64z m0-384v320h-64V288h64z"></path>
        </svg>
        <el-tooltip popper-class="tooltip" effect="dark" :content="tip1" placement="top" :popper-options="{ boundariesElement: 'body', gpuAcceleration: false }">
          <div>{{ tip1 }}</div>
        </el-tooltip>
      </div>

      <div class="tip-div">
        <svg class="icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="18" height="18">
          <path fill="red" d="M512 128c212.064 0 384 171.936 384 384s-171.936 384-384 384S128 724.064 128 512 299.936 128 512 128z m0 64C335.264 192 192 335.264 192 512s143.264 320 320 320 320-143.264 320-320S688.736 192 512 192z m32 480v64h-64v-64h64z m0-384v320h-64V288h64z"></path>
        </svg>
        <div>{{ tip2 }}</div>
      </div>

      <div @click="openPricing" style="display:flex;align-items:center;margin-left:25px;padding:10px 0;cursor:pointer;">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="18" height="18">
          <g>
            <path d="M16 29.333c-7.364 0-13.333-5.969-13.333-13.333s5.969-13.333 13.333-13.333 13.333 5.969 13.333 13.333-5.969 13.333-13.333 13.333zM16 26.667c5.891 0 10.667-4.776 10.667-10.667s-4.776-10.667-10.667-10.667v0c-5.891 0-10.667 4.776-10.667 10.667s4.776 10.667 10.667 10.667v0zM14.667 20h2.667v2.667h-2.667v-2.667zM17.333 17.807v0.86h-2.667v-2c0-0.736 0.597-1.333 1.333-1.333v0c1.105-0 2-0.895 2-2s-0.895-2-2-2c-0.966 0-1.772 0.685-1.959 1.595l-0.002 0.013-2.616-0.524c0.442-2.155 2.323-3.752 4.577-3.752 2.578 0 4.668 2.090 4.668 4.668 0 2.103-1.39 3.881-3.302 4.465l-0.033 0.009z" fill="rgba(142,139,139,1)"></path>
          </g>
        </svg>
        <div style="font-size:12px;margin-left:4px;color:#8e8b8b">How can I obtain an activation code?</div>
      </div>

      <div @click="openFaq" style="display:flex;align-items:center;margin-left:25px;text-align:left;width:350px;cursor:pointer;">
        <div>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="18" height="18">
            <g>
              <path d="M16 29.333c-7.364 0-13.333-5.969-13.333-13.333s5.969-13.333 13.333-13.333 13.333 5.969 13.333 13.333-5.969 13.333-13.333 13.333zM16 26.667c5.891 0 10.667-4.776 10.667-10.667s-4.776-10.667-10.667-10.667v0c-5.891 0-10.667 4.776-10.667 10.667s4.776 10.667 10.667 10.667v0zM14.667 20h2.667v2.667h-2.667v-2.667zM17.333 17.807v0.86h-2.667v-2c0-0.736 0.597-1.333 1.333-1.333v0c1.105-0 2-0.895 2-2s-0.895-2-2-2c-0.966 0-1.772 0.685-1.959 1.595l-0.002 0.013-2.616-0.524c0.442-2.155 2.323-3.752 4.577-3.752 2.578 0 4.668 2.090 4.668 4.668 0 2.103-1.39 3.881-3.302 4.465l-0.033 0.009z" fill="rgba(142,139,139,1)"></path>
            </g>
          </svg>
        </div>
        <div style="font-size:12px;margin-left:4px;color:#8e8b8b">
          I have already purchased the product, but I can't find my activation code. What should I do?
        </div>
      </div>
    </div>

    <div slot="footer" class="dialog-footer">
      <el-button @click="checkActiveCode" type="success">Activate</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { permissionCheck, redeemCode } from '@/api/permission'
import { $1_7Days_Pro, $9_30Days_Pro, PAY_TYPE_DICT } from '@/config/pay-config'
import { createNewWindowPage } from '@/utils/chrome-command-util'
import {
  MIGRATION_SIMPLE_FLOW,
  STORAGE_LICENSE_KEY,
  STORAGE_ACTIVATION_FLAG
} from '@/service/constants'

export default {
  name: 'ActiveCodeDialog',
  props: ['isShowActiveCode'],
  data() {
    return {
      codeStr: '',
      languageVal: '',
      tip1:
        "Your currently activated account is: the display of the user's own mobile phone number.Permissions are bound to your WhatsApp account, please pay attention to the switching of WhatsApp accounts",
      tip2:
        'Each activation code can only be used once and cannot be reused.Please confirm the account you want to activate~'
    }
  },
  methods: {
    closeActiveCodePopup() {
      this.languageVal = ''
      this.$emit('closeActiveCodePopup')
    },

    async checkActiveCode() {
      this.$sendLog?.(908305)
      if (!this.checkActiveNum()) return

      const original = (this.codeStr || '').trim()
      if (!original) {
        this.languageVal = 'Código inválido'
        this.$message?.error?.('Código inválido')
        return
      }

      // ===== Fluxo Supabase (migração) =====
      if (MIGRATION_SIMPLE_FLOW) {
        try {
          // Identificadores opcionais (não bloqueiam)
          const { userPhoneNum, userEmail } =
            (await new Promise((resolve) => {
              chrome.storage?.local?.get?.(['userPhoneNum', 'userEmail'], resolve)
            }).catch(() => ({}))) || {}

          // Tentamos original e, se falhar, sem hífens
          const candidates = Array.from(new Set([original, original.replace(/-/g, '')]))

          let ok = false
          let data = null
          let status = 0

          for (const candidate of candidates) {
            if (!candidate) continue
            const resp = await redeemCode({
              code: candidate,
              whatsapp: userPhoneNum,
              email: userEmail
            })
            ok = resp.ok
            data = resp.data
            status = resp.status
            if (ok) break
          }

          if (!ok) {
            const message =
              data?.message ||
              data?.error ||
              (status === 409 ? 'Código inválido ou já usado' : 'Falha ao ativar')
            this.languageVal = message
            this.$message?.error?.(message)
            this.$sendLog?.(908306, { s_message: 'activation_failed_supabase' })
            return
          }

          // ===== Bridge de compat p/ UI antiga: garantir "Pro" imediato =====
          const legacyPermission =
            data?.permissionInfo || {
              status: 'active',
              source: 'supabase',
              transaction_id: data?.transaction_id ?? null,
              plink_id: data?.plink_id ?? null,
              activated_at: Date.now()
            }

          const whatsappNumber = (userPhoneNum || '').replace?.(/\D/g, '') || null

          await chrome.storage?.local?.set?.({
            [STORAGE_LICENSE_KEY]: data, // ex.: myapp_license
            [STORAGE_ACTIVATION_FLAG]: true, // ex.: myapp_activation
            paid_mark: true, // flag lida pelo header para exibir "Pro"
            permissionInfo: legacyPermission // objeto mínimo p/ telas legadas
          })

          // limpar bandeiras de "sem assinatura"
          chrome.storage?.local?.remove?.([
            'isShowNoSubscription',
            'isOneNoSubscription',
            'isShowNoActive',
            'actionCodeList'
          ])

          // notificar UI e fechar
          this.$emit(
            'changePermissionCode',
            legacyPermission?.plink_id ?? 'supabase_pro',
            legacyPermission?.transaction_id ?? null,
            whatsappNumber
          )

          this.languageVal = ''
          this.$message?.success?.('Ativado')
          this.closeActiveCodePopup()
          return
        } catch (error) {
          console.error('[MIG-REDEEM]', error)
          this.languageVal = 'Falha ao ativar'
          this.$message?.error?.('Falha ao ativar')
          return
        }
      }

      // ===== LEGADO (quando MIGRATION_SIMPLE_FLOW === false) =====
      let activeCode = this.codeStr.replace(' ', '')
      if (!this.checkSubkey(activeCode)) {
        this.$sendLog?.(908306, { s_message: '激活失败' })
        this.languageVal = 'Active Code Error'
        return
      }

      chrome.storage.local.get(['userPhoneNum', STORAGE_LICENSE_KEY], (res) => {
        const whatsappNumber = (res.userPhoneNum || '').replace(/\D/g, '')
        if (!whatsappNumber) {
          this.languageVal = 'WhatsApp Number Error'
          return
        }
        permissionCheck(whatsappNumber, activeCode).then((response) => {
          if (response.code === 100000) {
            chrome.storage.local.remove([
              'isShowNoSubscription',
              'isOneNoSubscription',
              'isShowNoActive',
              'actionCodeList'
            ])
            chrome.storage.local.set({ permissionInfo: response.data, paid_mark: true }, () => {})
            this.$emit(
              'changePermissionCode',
              response.data['plink_id'],
              response.data['transaction_id'],
              whatsappNumber
            )
            this.closeActiveCodePopup()
          } else {
            this.languageVal = response.message
          }
        })
      })
    },

    checkActiveNum() {
      this.languageVal = ''
      if (MIGRATION_SIMPLE_FLOW) return true
      const normalized = (this.codeStr || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase()
      if (!normalized || normalized.length !== 8) {
        this.$sendLog?.(908306, { s_message: '激活码为空' })
        this.languageVal = 'Active Code Error'
        return false
      }
      return true
    },

    checkSubkey(activeCode) {
      if (MIGRATION_SIMPLE_FLOW) return true
      let first = activeCode.substring(0, 1)
      let rest = activeCode.substring(1)
      let total = 0
      for (let ch of rest) total += ch.charCodeAt(0)
      let hex = total.toString(16)
      let endHex = hex.substring(hex.length - 1)
      return endHex === first
    },

    openPricing() {
      this.$emit('openPricing')
    },
    openFaq() {
      window.open('https://scrm-global.zingfront.com/sender/wapi_sender/faq.html')
    }
  }
}
</script>

<style scoped>
.active-code { display:inline-block; width:90%; }
/* tips */
.tip-div { display:flex; align-items:center; margin-left:25px; text-align:left; width:350px; cursor:pointer; padding-top:10px; }
.tip-div > div {
  font-size:12px; margin-left:4px; color:red; display:-webkit-box; overflow:hidden;
  -webkit-box-orient:vertical; -webkit-line-clamp:2; word-wrap:break-word; width:calc(100% - 18px); word-break:keep-all;
}
.el-dialog.el-dialog--center.activeCodeDialog > .el-dialog__footer { margin:6px auto 17px; padding-top:0 !important; }
.codeInput { text-align:center; margin-bottom:5px; }
.alertLanguage { color:red; }
.el-dialog__footer .el-button--success,
.el-dialog__footer .el-button--success:hover {
  width:160px; height:32px; border-radius:4px; background-color:#37b64a; font-size:14px;
  text-align:center; font-family:Roboto; align-items:center; justify-content:center; padding:0;
}
</style>
<style>
.activeCodeDialog .el-dialog__header { padding:20px; background-color:#37b64a; }
.activeCodeDialog .el-dialog__header .el-dialog__title { font-family: SourceHanSansSC-bold; color:#ffffff; }
.activeCodeDialog .el-dialog__body { padding:25px 25px 10px 25px !important; }
.tooltip { width:300px !important; }
</style>
