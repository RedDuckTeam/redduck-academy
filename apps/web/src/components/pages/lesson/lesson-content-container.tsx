export const LessonContentContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <section className="relative mx-auto flex min-w-0 w-full max-w-[1100px] flex-1 flex-col items-start gap-10">
      {children}
    </section>
  )
}
