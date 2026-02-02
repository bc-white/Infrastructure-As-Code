import { SidebarTrigger } from "@/components/ui/sidebar"
import { ChevronLeft } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { resolveToken } from "@/utils/resolveToken"
import { tokens } from "@/styles/theme"
import { getTheme } from "@/styles/getTheme"

export function SiteHeader({ title, subheading, actions, showBackButton = false }: { 
  title: string, 
  subheading: string, 
  actions?: React.ReactNode,
  showBackButton?: boolean 
}) {
  const navigate = useNavigate();
  const theme = getTheme();
  const handleBack = () => {
    navigate(-1);
  };

  return (
    <header 
    className="flex h-14 items-center border-b px-9 py-9"
    style={{
      background: resolveToken(theme === 'dark' ? tokens.Dark.Surface.Primary : tokens.Light.Surface.Primary),
      color: resolveToken(theme === 'dark' ? tokens.Dark.Typography.Heading : tokens.Light.Typography.Heading)
    }}
    >
      <div className="flex gap-2 items-center justify-between w-full">
        <div className="flex gap-2">
          {showBackButton ? (
            <button 
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          ) : (
            <SidebarTrigger />
          )}
          <div className="flex flex-col gap-0">
            <h1 className="text-xl font-medium text-text-strong-950 font-brico">{title}</h1>
            <p className="text-text-sub-600 text-sm">{subheading}</p>
          </div>
        </div>
        <div>
          {actions}
        </div>
      </div>
    </header>
  )
}
