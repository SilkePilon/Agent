import { LineWobble } from 'ldrs/react'
import 'ldrs/react/LineWobble.css'

export function TypingIndicator() {
  return (
    <div className="flex justify-left space-x-1">
      <div className="rounded-lg bg-muted p-2">
        <LineWobble
          size={40}
          stroke={3}
          bgOpacity={0.1}
          speed={1.75}
          color="var(--foreground)"
        />
      </div>
    </div>
  )
}
