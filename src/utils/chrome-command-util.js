import { MIGRATION_SIMPLE_FLOW } from '@/service/constants'

function createNewWindowPage(url) {
  if (MIGRATION_SIMPLE_FLOW) {
    // modo novo não abre HTML local de planos
    return
  }
  chrome.windows.create(
    // {
    //   focused: true,
    //   type: 'popup',
    //   url: url,
    //   height: 764 - 100,
    //   width: 1440,
    //   left: 0,
    //   top: 150
    // },
    {
      focused: true,
      type: 'popup',
      url: url,
      height: 980,
      width: 1440,
      left: 10,
      top: 10
    },
    (windows) => {
      console.log(windows)
    }
  )
}

export { createNewWindowPage }
