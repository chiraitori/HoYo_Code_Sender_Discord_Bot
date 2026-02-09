'use client';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface Option {
    value: string;
    label: string;
}

interface CustomSelectProps {
    value: string | null;
    onChange: (value: string) => void;
    options: Option[];
    placeholder?: string;
    label?: string;
    icon?: string;
}

export default function CustomSelect({
    value,
    onChange,
    options,
    placeholder = 'Select an option',
    label,
    icon
}: CustomSelectProps) {
    // Radix UI Select does not support empty string values, so we mask them
    const NULL_VALUE = "_NULL_";
    const internalValue = value === "" ? NULL_VALUE : (value || undefined);

    const handleValueChange = (newValue: string) => {
        onChange(newValue === NULL_VALUE ? "" : newValue);
    };

    return (
        <div className="relative">
            {label && (
                <label className="block text-violet-200/80 font-bold mb-2 text-xs uppercase tracking-wider flex items-center gap-2">
                    {icon && <span>{icon}</span>}
                    {label}
                </label>
            )}

            <Select value={internalValue} onValueChange={handleValueChange}>
                <SelectTrigger className="w-full px-4 py-3 h-auto rounded-xl border bg-black/30 border-white/10 text-violet-200/80 hover:bg-black/40 hover:text-white transition-all duration-200 data-[state=open]:bg-black/40 data-[state=open]:border-accent-cyan data-[state=open]:text-white data-[state=open]:ring-1 data-[state=open]:ring-accent-cyan focus:ring-accent-cyan focus:ring-offset-0">
                    <SelectValue placeholder={<span className="text-violet-300/40">{placeholder}</span>} />
                </SelectTrigger>
                <SelectContent className="glass-panel border-white/10 bg-[#050510]/95 backdrop-blur-xl rounded-xl shadow-2xl overflow-hidden max-h-[350px]">
                    {options.length > 0 ? (
                        options.map((option) => (
                            <SelectItem
                                key={option.value || NULL_VALUE}
                                value={option.value === "" ? NULL_VALUE : option.value}
                                className="focus:bg-violet-600 focus:text-white text-violet-200/80 cursor-pointer py-2.5 my-1 rounded-lg transition-colors data-[state=checked]:bg-violet-600 data-[state=checked]:text-white"
                            >
                                {option.label}
                            </SelectItem>
                        ))
                    ) : (
                        <div className="px-3 py-4 text-center text-violet-300/40 text-sm">
                            No options available
                        </div>
                    )}
                </SelectContent>
            </Select>
        </div>
    );
}
