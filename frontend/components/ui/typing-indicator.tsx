import { Squircle } from 'ldrs/react'
import 'ldrs/react/Squircle.css'

export function TypingIndicator() {
  return (
    <div className="flex items-center space-x-3">
      <div className="rounded-lg bg-muted p-2 w-8 h-8 flex items-center justify-center">
        <Squircle
          size={20}
          stroke={3}
          strokeLength={0.15}
          bgOpacity={0.1}
          speed={0.9}
          color="black"
        />
      </div>
      <span className="text-sm text-muted-foreground">
        Een moment geduld alstublieft...
      </span>
    </div>
  )
}