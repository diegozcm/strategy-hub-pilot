import { useTheme } from "next-themes"
import { Toaster as Sonner, toast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-center"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-[#10283F] group-[.toaster]:border-[#CDD966] group-[.toaster]:shadow-lg group-[.toaster]:rounded-xl group-[.toaster]:py-3 group-[.toaster]:px-5",
          description: "group-[.toast]:text-[#10283F]/70",
          actionButton:
            "group-[.toast]:bg-[#CDD966] group-[.toast]:text-[#10283F]",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          error:
            "group-[.toaster]:!bg-red-50 group-[.toaster]:!text-red-800 group-[.toaster]:!border-red-500",
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
