import { Switch } from '@/ui/switch.tsx'
import { type ViewSchemeId } from '@/constants/grouping-schemes.ts'

export function ViewSchemeToggle({
	value,
	onChange,
}: {
	value: ViewSchemeId
	onChange: (id: ViewSchemeId) => void
}) {
	const isGrouped = value === 'public_domain'

	return (
		<div className="flex items-center gap-2">
			<Switch
				id="group-by-toggle"
				checked={isGrouped}
				onCheckedChange={(checked) =>
					onChange(checked ? 'public_domain' : 'flat')
				}
			/>
			<label
				htmlFor="group-by-toggle"
				className="cursor-pointer text-xs text-gray-500"
			>
				Group by public domain
			</label>
		</div>
	)
}
