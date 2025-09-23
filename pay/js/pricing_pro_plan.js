$(function () {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['MIGRATION_SIMPLE_FLOW'], (res) => {
      if (res && res.MIGRATION_SIMPLE_FLOW) {
        console.info('[MIG] pricing_pro_plan disabled by MIGRATION_SIMPLE_FLOW')
        return
      }
      initData()
    })
  } else {
    initData()
  }
})
//获取参数方法
function getHref() {
  var url = decodeURI(location.search)
  var theRequest = new Object()
  if (url.indexOf('?') != -1) {
    var str = url.substr(1)
    strs = str.split('&')
    for (var i = 0; i < strs.length; i++) {
      theRequest[strs[i].split('=')[0]] = unescape(strs[i].split('=')[1])
    }
  }
  return theRequest
}
/**
 * @description: 初始化数据
 * @return {*}
 */
function initData() {
  let data = JSON.parse(getHref().planList)
  console.log(data)
  const showFree = data.some((item) => {
    return item.planGroup === 1
  })
  if (showFree) {
    $('.container-menu ul li:eq(0)').text('Free&Trial')
  }
  // 找到第一个activeGroup为true的元素
  const firstActiveGroup = data.find((item) => item.activeGroup)
  if (firstActiveGroup) {
    $(`.container-menu ul li:eq(${firstActiveGroup.planGroup - 1})`)?.addClass('active-li')
    $('.price-tab')?.each(function (index) {
      if (index === firstActiveGroup.planGroup - 1) {
        $(this)?.show()
      } else {
        $(this)?.hide()
      }
    })
  } else {
    $('.container-menu ul li:eq(1)')?.addClass('active-li')

    $('.price-tab')?.each(function (index) {
      if (index === 1) {
        $(this)?.show()
      } else {
        $(this)?.hide()
      }
    })
  }
  const showPermanent = data.some((item) => {
    return item.planGroup === 5
  })
  if (showPermanent) {
    if (showFree) {
      $('.container-menu ul li:eq(4)').show()
    }
  }
  data.forEach((item) => {
    fillPlan(item)
  })
}

function fillPlan(data) {
  if (!data.enablingStatus) {
    return false
  }
  if (data.active) {
    $(`${data.className}`).children().addClass('active')
  }
  $(`${data.className}`).show()
  $(`${data.className} .trial-count`).text(data.count)
  $(`${data.className} .trial-day`).text(data.day)

  $(`${data.className} .trial-click`)
    .off('click')
    .on('click', function () {
      openOrder(data.code, data.planName)
    })
  $(`${data.className} .trial-price`).html(
    `${data.price} &nbsp;<s class="trial-original-price" style="color: #ccc">(${data.originalPrice})</s>`
  )
}

changePriceTabs()
function changePriceTabs() {
  const lis = document.querySelectorAll('.container-menu ul li')
  const priceTabs = document.querySelectorAll('.price-tab')
  lis.forEach((item, i) => {
    item.addEventListener('click', function (e) {
      priceTabs.forEach((temp, j) => {
        if (i == j) {
          $(temp).show()
        } else {
          $(temp).hide()
        }
      })
      lis.forEach((itemK, k) => {
        if (i == k) {
          $(itemK).addClass('active-li')
        } else {
          $(itemK).removeClass('active-li')
        }
      })
    })
  })
}

async function openOrder(plink_id, planName) {
  // async function openOrder(planName) {
  //   const plink_id = 'plink_1RvVaeBNqRnfJH4Pwymq4oX8'
  sendLog(908301, { s_plan: planName })
  const loadingContainer = document.querySelector('.loading-container')
  loadingContainer.classList.remove('hide')
  const { userPhoneNum } = await chrome.storage.local.get('userPhoneNum')
  const metadata = {
    extension_type: 2,
    plink_id: plink_id,
    whatsapp_number: userPhoneNum
  }
  let requestObj = {
    payment_method: 'card',
    currency: 'usd',
    metadata: metadata
  }

  // 通过background script发送请求，避免CORS问题
  chrome.runtime.sendMessage({
    type: 'makeOrder',
    requestObj: requestObj
  })
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'makeOrderResponse') {
    const response = request.data
    if (response) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs.length > 0) {
          chrome.tabs.update(tabs[0].id, { url: response.data.url })
          const loadingContainer = document.querySelector('.loading-container')
          loadingContainer.classList.add('hide')
        }
      })
    } else {
      const loadingContainer = document.querySelector('.loading-container')
      loadingContainer.classList.add('hide')
    }
  }
})

$(`#plan-free`).on('click', () => {
  freeUseNow()
})

function freeUseNow() {
  window.close()
}

let basicLogInfo = getBasicLogInfo()

const domFree = document.querySelector('#plan-free')
const domOneDollar = document.querySelector('#plan-1')
const domNineDollar = document.querySelector('#plan-9')
const domTwentyDollar = document.querySelector('#plan-20')

// domeChange()
function domeChange() {
  let href = window.location.href.split('?permissionInfo=')[1]
  let dome = document.getElementsByClassName('pc-price pc-price-7')
  if (href) {
    if (href == '1_7') {
      sendLog(908309, { s_plan: 2 })
    } else if (href == '9_30') {
      dome[1].className = 'pc-price pc-price-7 active text-center'
      domNineDollar.innerHTML = 'Current'
      domNineDollar.className = 'pc-btn pc-btn-7 current'
      dome[2].className = 'pc-price pc-price-7 text-center'
      domTwentyDollar.innerHTML = 'ORDER MORE'
      sendLog(908309, { s_plan: 3 })
    } else if (href == '20_30') {
      dome[2].className = 'pc-price pc-price-7 active text-center'
      domTwentyDollar.innerHTML = 'Current'
      domTwentyDollar.className = 'pc-btn pc-btn-7 current'
      dome[1].className = 'pc-price pc-price-7 text-center'
      domNineDollar.innerHTML = 'ORDER MORE'
      sendLog(908309, { s_plan: 4 })
    }
    document.getElementsByClassName('pc-price pc-price-7 active text-center')[0].onmouseover =
      function (e) {
        document
          .getElementsByClassName('pc-price pc-price-7 active text-center')[0]
          .getElementsByClassName('pc-btn pc-btn-7')[0].innerHTML = 'ORDER MORE'
      }
    document.getElementsByClassName('pc-price pc-price-7 active text-center')[0].onmouseout =
      function (e) {
        document
          .getElementsByClassName('pc-price pc-price-7 active text-center')[0]
          .getElementsByClassName('pc-btn pc-btn-7')[0].innerHTML = 'Current'
      }
  } else {
    sendLog(908309, { s_plan: 1 })
  }
}

function getBasicLogInfo() {
  const res = {}
  const url = new URL(location.href)
  const iter = url.searchParams.entries()

  let result = iter.next()
  while (!result.done) {
    const [k, v] = result.value
    res[k] = v
    result = iter.next()
  }
  return res
}

function sendLog(code, otherParams) {
  console.log('sendLog')
  let params = {
    ...basicLogInfo,
    event_source: 9,
    event_type: code,
    event_time: Math.round(new Date() / 1000),
    ...otherParams
  }
  logger.logger.send(params)
}

domFree?.addEventListener('click', function () {
  sendLog(908301, { s_plan: 1 })
})

domOneDollar?.addEventListener('click', function () {
  sendLog(908301, { s_plan: 2 })
})

domNineDollar?.addEventListener('click', function () {
  sendLog(908301, { s_plan: 3 })
})

domTwentyDollar?.addEventListener('click', function () {
  sendLog(908301, { s_plan: 4 })
})
