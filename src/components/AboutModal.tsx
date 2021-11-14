import React from 'react'
import { useWindowSize } from 'react-use'
import Link from './Link'
import Modal from './Modal'

interface AboutModalProps {
  onClose: () => void
}

export default function AboutModal(props: AboutModalProps) {
  const { onClose } = props
  const windowSize = useWindowSize()
  return (
    <Modal onClose={onClose}>
      <div className="text-sm sm:text-lg space-y-3">
        {windowSize.width > 640 && (
          <p>
            Some photobomber ruined your selfie? There’s a ketchup stain on your
            shirt? You want to replace some text or graphic?
          </p>
        )}

        <p>
          <Link href="https://cleanup.pictures">CleanUp.pictures</Link> is a web
          application that lets you cleanup photos with a quick & simple
          interface.
        </p>

        <p>
          The free version processes images at a 720p while Cleanup Pro allows
          high resolution up to 2K with no compression.
        </p>

        <p>
          It uses <Link href="https://arxiv.org/abs/2109.07161">LaMa</Link>, an
          open-source model from Samsung’s AI Lab to automatically redraw the
          areas that you select.
        </p>

        <p>
          <Link href="https://cleanup.pictures">CleanUp.pictures</Link> has been
          built by the engineering team at{' '}
          <Link href="https://clipdrop.co">ClipDrop</Link> and is{' '}
          <Link href="https://github.com/initml/cleanup.pictures">
            open-source
          </Link>{' '}
          under the Apache License 2.0.
        </p>

        <p>
          Your images are <b>*not*</b> stored on our servers. They are
          immediately discarded after processing.
        </p>
      </div>
    </Modal>
  )
}
