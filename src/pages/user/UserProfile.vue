<template>
  <el-dialog
    :visible.sync="isShowUserProfile"
    width="459px"
    top="120px"
    custom-class="userProfile"
    :modal-append-to-body="false"
    :show-close="false"
    :close-on-click-modal="true"
    @close="closeUserProfilePopup"
    @open="openUserProfilePopup"
    center
    :title="phoneNumberText"
  >
    <div class="dialogBody" v-loading="loading">
      <table border="0">
        <tr>
          <td class="tableHead">{{ $t('profile.currentPlan') }}</td>
          <td
            class="tableContent"
            @click="openPricing"
            :style="currentPlan === '-' ? '' : 'text-decoration: underline;cursor: pointer;'"
          >
            {{ currentPlan }}
          </td>
        </tr>
        <tr>
          <td class="tableHead">{{ $t('profile.joinedDate') }}</td>
          <td class="tableContent">{{ joinedDate }}</td>
        </tr>
        <tr>
          <td class="tableHead">{{ $t('profile.servicePeriod') }}</td>
          <td class="tableContent">{{ servicePeriod }}</td>
        </tr>
        <tr>
          <td class="tableHead">{{ $t('profile.upcomingPayments') }}</td>
          <td class="tableContent">{{ upcomingPayments }}</td>
        </tr>
        <tr>
          <td class="tableHead">{{ $t('profile.state') }}</td>
          <td class="tableContent" v-if="!isInputEmail">
            <span class="subscriptState" style="word-break: keep-all"
              >{{ subscriptState }}
              <span v-if="showTrialTip">{{ $t('profile.showTrialTip') }}</span>
            </span>
            <el-button
              type="info"
              size="small"
              v-if="subscriptState === 'subscript' && showCancel"
              @click="cancelSubscription(transactionId)"
            >
              {{ $t('profile.cancelSubscription') }}
            </el-button>
          </td>
          <td class="tableContent" v-if="isInputEmail">
            <el-input placeholder="{{ $t('profile.inputPayEmail') }}" v-model="email"> </el-input>
            <el-button type="info" size="small" @click="sureCancelSubscription(transactionId)"
              >{{ $t('profile.sure') }}
            </el-button>
          </td>
        </tr>
      </table>
    </div>
  </el-dialog>
</template>

<script>
import {
  cancelTransaction,
  getTransactionInfo,
  getLicenseStatus
} from '@/api/permission'
import { formatTime } from '@/utils/time-util'
import { $1_7Days_Pro } from '@/config/pay-config'
import { MIGRATION_SIMPLE_FLOW, STORAGE_LICENSE_KEY, LICENSE_STATUS_URL } from '@/service/constants'

export default {
  name: 'UserProfile',
  data() {
    return {
      phoneNumberText: this.$t('profile.phoneNumberText'),
      currentPlan: '-',
      joinedDate: '-',
      servicePeriod: '-',
      upcomingPayments: '-',
      subscriptState: '-',
      transactionId: '',
      showCancel: true,
      isInputEmail: false,
      email: '',
      loading: false,
      showTrialTip: ''
    }
  },
  props: ['isShowUserProfile'],
  created() {
    const storage = chrome?.storage?.local
    storage?.get?.(['userPhoneNum'], (res = {}) => {
      if (res.userPhoneNum) {
        this.phoneNumberText = 'User Profile: ' + res.userPhoneNum
      }
    })
  },
  methods: {
    openPricing() {
      if (this.currentPlan !== '-') {
        this.$emit('openPricing', 'user')
      }
    },
    cancelSubscription() {
      if (MIGRATION_SIMPLE_FLOW) return
      this.isInputEmail = true
    },
    sureCancelSubscription(transaction_id) {
      if (MIGRATION_SIMPLE_FLOW) return
      let _This = this
      cancelTransaction(transaction_id, _This.email).then((response) => {
        if (response.code === 100000) {
          _This.showCancel = false
          _This.isInputEmail = false
          _This.subscriptState = 'unsubscript'
          this.$message({
            showClose: true,
            message: 'cancel subscription success',
            type: 'success'
          })
        } else {
          this.$message({
            showClose: true,
            message: response.message,
            type: 'error'
          })
          this.isInputEmail = false
        }
      })
    },
    closeUserProfilePopup() {
      this.$emit('closeUserProfilePopup')
    },
    async openUserProfilePopup() {
      this.loading = true
      if (MIGRATION_SIMPLE_FLOW) {
        try {
          const storageKeys = [STORAGE_LICENSE_KEY, 'userPhoneNum', 'userEmail']
          const storageData =
            (await new Promise((resolve) => {
              const storage = chrome?.storage?.local
              const getter = storage?.get
              if (typeof getter === 'function') {
                getter.call(storage, storageKeys, resolve)
              } else {
                resolve({})
              }
            }).catch(() => ({}))) || {}
          const storedLicense =
            storageData?.[STORAGE_LICENSE_KEY] ?? storageData?.myapp_license ?? null
          const whatsapp =
            typeof storageData.userPhoneNum === 'string'
              ? storageData.userPhoneNum.replace(/\D/g, '')
              : undefined
          const email =
            typeof storageData.userEmail === 'string' && storageData.userEmail
              ? storageData.userEmail
              : undefined
          let licensePayload = storedLicense
          if (LICENSE_STATUS_URL && (whatsapp || email)) {
            try {
              const { ok, data } = await getLicenseStatus({ whatsapp, email })
              if (ok && data) {
                licensePayload = data?.license ?? data?.data ?? data
              }
            } catch (error) {
              console.error('[MIG] license-status failed', error)
            }
          }
          this.populateFromLicense(licensePayload)
        } finally {
          this.loading = false
        }
        return
      }
      let _This = this
      chrome.storage.local.get(['permissionInfo'], function (res) {
        if (res.permissionInfo && 'transaction_id' in res.permissionInfo) {
          _This.showTrialTip = res.permissionInfo.plink_id === $1_7Days_Pro
          getTransactionInfo(res.permissionInfo['transaction_id']).then((response) => {
            if (response.code === 100000) {
              _This.currentPlan = response.data['current_plan']
              _This.joinedDate = response.data['joined_date']
                ? formatTime(response.data['joined_date'])
                : '-'
              _This.servicePeriod =
                (response.data['service_begin_period']
                  ? formatTime(response.data['service_begin_period'])
                  : '') +
                '-' +
                (response.data['service_end_period']
                  ? formatTime(response.data['service_end_period'])
                  : '')
              _This.upcomingPayments = response.data['upcoming_payments']
                ? formatTime(response.data['upcoming_payments'])
                : '-'

              // state:1:subscript  state:2:Not Subscribed
              _This.subscriptState = response.data['state'] === 1 ? 'subscript' : 'Not Subscribed'
              _This.showCancel = response.data['state'] === 1
              _This.transactionId = res.permissionInfo['transaction_id']
              _This.loading = false
            } else {
              _This.loading = false
            }
          })
        } else {
          _This.loading = false
        }
      })
    },
    populateFromLicense(license) {
      const status = license?.status ?? '-'
      const plan = license?.plan ?? status
      this.currentPlan = plan || '-'
      const joined = this.formatLicenseDate(
        license?.issued_at || license?.activated_at || license?.created_at
      )
      const expires = this.formatLicenseDate(
        license?.expires_at || license?.expiration || license?.expired_at
      )
      const nextPayment = this.formatLicenseDate(
        license?.next_payment_at || license?.upcoming_payments
      )
      this.joinedDate = joined
      this.servicePeriod = joined !== '-' || expires !== '-' ? `${joined} / ${expires}` : '-'
      this.upcomingPayments = nextPayment
      this.subscriptState = status || '-'
      this.showCancel = false
      this.showTrialTip = false
      this.transactionId = license?.transaction_id || ''
      this.isInputEmail = false
      this.email = ''
    },
    formatLicenseDate(value) {
      if (value === null || value === undefined || value === '') {
        return '-'
      }
      if (value instanceof Date) {
        return this.formatDateObject(value)
      }
      if (typeof value === 'number') {
        if (value > 1e12) {
          return this.formatDateObject(new Date(value))
        }
        if (value > 1e9) {
          return formatTime(Math.floor(value))
        }
        return '-'
      }
      if (typeof value === 'string') {
        const trimmed = value.trim()
        if (!trimmed) return '-'
        const numeric = Number(trimmed)
        if (!Number.isNaN(numeric)) {
          if (numeric > 1e12) {
            return this.formatDateObject(new Date(numeric))
          }
          if (numeric > 1e9) {
            return formatTime(Math.floor(numeric))
          }
        }
        const parsed = Date.parse(trimmed)
        if (!Number.isNaN(parsed)) {
          return this.formatDateObject(new Date(parsed))
        }
        return trimmed
      }
      return '-'
    },
    formatDateObject(date) {
      if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
        return '-'
      }
      const pad = (num) => `${num}`.padStart(2, '0')
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
        date.getHours()
      )}:${pad(date.getMinutes())}`
    }
  }
}
</script>

<style scoped>
.dialogBody {
  width: 100%;
}

.dialogBody tr {
  width: 100%;
  line-height: 20px;
}

table {
  width: 100%;
}

.el-dialog.el-dialog--center.userProfile > .el-dialog__footer {
  margin: 6px auto 17px;
  padding-top: 0 !important;
}

.tableHead {
  font-weight: bold;
  width: 40%;
}

.tableContent {
  width: 60%;
  font-size: 12px;
}
.tableContent >>> .el-input > input {
  height: 20px;
}

::v-deep .el-dialog__header {
  background-color: #37b64a;
  font-size: 20px;
  font-weight: bold;
}

.el-button--info,
.el-button--info:hover {
  padding: 3px 6px !important;
  border-radius: 4px;
  text-align: center;
  align-items: center;
  justify-content: center;
}

.subscriptState {
  margin-right: 20px;
}
.el-input {
  width: 70%;
}
</style>
