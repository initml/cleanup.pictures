import React from 'react'
import Link from './Link'
import Modal from './Modal'

interface KittyModalProps {
  onClose: () => void
}

export default function KittyModal(props: KittyModalProps) {
  const { onClose } = props
  return (
    <Modal onClose={onClose}>
      <div className="text-sm sm:text-lg space-y-8 text-center">
        <h1 className="text-3xl font-bold">🚨 We need you! 🚨</h1>
        <p>
          Cleanup has been nomited for a 🏆{' '}
          <Link href="https://www.producthunt.com/golden-kitty-awards-2021/ai-machine-learning">
            Product Hunt Golden Kitty Award
          </Link>{' '}
          in the AI category.
        </p>
        <p>
          It only takes 1 click, and your support would help this tool a lot!
          <br />
          Votes end on <b>Sunday 16th</b>.
        </p>
        <p>👇👇👇</p>
        <p>
          <a
            href="https://www.producthunt.com/golden-kitty-awards-2021/ai-machine-learning"
            target="_blank"
            rel="noreferrer"
          >
            <img
              className="m-auto rounded-xl h-48"
              src="https://pbs.twimg.com/card_img/1481907824330424323/FNgwrKO1?format=jpg&name=small"
              alt="Product Hunt Golden Kitty Award"
            />
          </a>
        </p>
      </div>
    </Modal>
  )
}
