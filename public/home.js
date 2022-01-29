// Usecase module

function setupUsecases() {
  let usecases = ['photo', 'agency', 'realestate', 'ecomm', 'watermark', 'api']
  let current = usecases[Math.floor(Math.random() * usecases.length)]

  const update = () => {
    bts.forEach(bt => {
      const { usecase } = bt.dataset
      if (usecase === current) {
        bt.classList.add('active')
      } else {
        bt.classList.remove('active')
      }
    })

    const blocks = document.querySelectorAll('div[data-usecase]')
    blocks.forEach(block => {
      block.style.display = block.dataset.usecase === current ? 'block' : 'none'
    })
  }

  const bts = document.querySelectorAll('li[data-usecase]')
  for (const bt of bts) {
    bt.addEventListener('click', () => {
      current = bt.dataset.usecase
      update()
    })
  }
  update()
}
setupUsecases()
