export const motionPresets = {
  pageEnter: 'np-anim-fade-up',
  panelEnter: 'np-anim-fade-in',
  modalEnter: 'np-anim-scale-in',
  dropdownEnter: 'np-anim-scale-in',
  toastEnter: 'np-anim-slide-down',
  confirmPop: 'np-anim-draw-check',
} as const

export type MotionPreset = keyof typeof motionPresets