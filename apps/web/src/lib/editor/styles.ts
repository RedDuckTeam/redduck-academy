export const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'

export const noticeClass = 'flex flex-col gap-2 border border-primary p-4'

export const quietNoticeClass = 'flex flex-col gap-2 border border-border p-4'

/**
 * The shared Button scales its type up at `md` and again at `2xl`. That is right for a page's main
 * action and far too loud beside 14px prose, so a button inside a notice opts out of both.
 */
export const compactButtonClass = '!text-[14px] !leading-none'
