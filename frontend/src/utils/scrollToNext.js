export function scrollToNextSection(currentSectionId, delay = 400) {
  setTimeout(() => {
    const allSections = Array.from(
      document.querySelectorAll('[data-section]')
    )
    const currentIndex = allSections.findIndex(
      el => el.dataset.section === currentSectionId
    )
    const next = allSections[currentIndex + 1]
    if (next) {
      next.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
      // Pulse the next section border to draw attention
      next.classList.add('pulse-once')
      setTimeout(() => next.classList.remove('pulse-once'), 700)
    }
  }, delay)
}
