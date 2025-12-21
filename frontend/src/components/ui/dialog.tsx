import * as React from "react"
import { X } from "lucide-react"

export function cn(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(" ")
}

// Minimal Context to share open state if using Compound Components strictly
// But the usage in AdminFastTrack passes `open` and `onOpenChange` to the Root.
// The content is rendered inside.
// We need to implement a basic Modal.

interface DialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    children: React.ReactNode;
}

const DialogContext = React.createContext<{
    open: boolean;
    onOpenChange: (open: boolean) => void;
}>({
    open: false,
    onOpenChange: () => { },
});

const Dialog = ({ open, onOpenChange, children }: DialogProps) => {
    // If controlled, use props. If uncontrolled (not supported fully here based on usage), use state.
    // Usage in file is controlled: <Dialog open={!!selectedClaim} onOpenChange={...}>

    // safe defaults
    const isControlled = open !== undefined;
    const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);

    const actualOpen = isControlled ? open : uncontrolledOpen;
    const actualOnOpenChange = onOpenChange || setUncontrolledOpen;

    return (
        <DialogContext.Provider value={{ open: !!actualOpen, onOpenChange: actualOnOpenChange }}>
            {children}
        </DialogContext.Provider>
    )
}

const DialogContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
    const { open, onOpenChange } = React.useContext(DialogContext);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/80"
                onClick={() => onOpenChange(false)}
            />
            {/* Content */}
            <div
                ref={ref}
                className={cn(
                    "relative z-50 grid w-full max-w-lg gap-4 border p-6 shadow-lg duration-200 animate-in fade-in-0 zoom-in-95 sm:rounded-lg",
                    className
                )}
                {...props}
            >
                {children}
                <button
                    className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
                    onClick={() => onOpenChange(false)}
                >
                    <X className="h-4 w-4 text-slate-400" />
                    <span className="sr-only">Close</span>
                </button>
            </div>
        </div>
    )
})
DialogContent.displayName = "DialogContent"

const DialogHeader = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn(
            "flex flex-col space-y-1.5 text-center sm:text-left",
            className
        )}
        {...props}
    />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn(
            "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
            className
        )}
        {...props}
    />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
    <h3
        ref={ref}
        className={cn(
            "text-lg font-semibold leading-none tracking-tight",
            className
        )}
        {...props}
    />
))
DialogTitle.displayName = "DialogTitle"

export {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
}
