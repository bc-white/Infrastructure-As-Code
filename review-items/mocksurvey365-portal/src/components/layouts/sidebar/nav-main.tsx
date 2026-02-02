import * as React from "react"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

interface NavItem {
  title: string
  url: string
  icon?: React.ComponentType
  isActive?: boolean
  items?: { title: string; url: string }[]
}

interface NavMainProps {
  items: NavItem[]
}

export function NavMain({ items }: NavMainProps) {
  return (
    <div className="flex flex-col gap-2">
      {items.map((item, index) => (
        <Collapsible key={index}>
          <CollapsibleTrigger asChild>
            <Button
              variant={item.isActive ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-2",
                item.isActive && "bg-secondary"
              )}
            >
              {item.icon && (
                <span className="h-4 w-4 flex items-center justify-center">
                  {React.createElement(item.icon)}
                </span>
              )}
              <span className="truncate">{item.title}</span>
            </Button>
          </CollapsibleTrigger>
          {item.items && (
            <CollapsibleContent className="ml-4 mt-2">
              <div className="flex flex-col gap-2">
                {item.items.map((subItem, subIndex) => (
                  <Link
                    key={subIndex}
                    to={subItem.url}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {subItem.title}
                  </Link>
                ))}
              </div>
            </CollapsibleContent>
          )}
        </Collapsible>
      ))}
    </div>
  )
} 