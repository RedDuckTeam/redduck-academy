export const LessonContentContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <section className="flex max-w-[1380px] w-full items-start relative mx-auto gap-10 flex-col">{children}</section>
  )
}
