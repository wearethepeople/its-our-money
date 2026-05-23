import { Button } from '@/ui/button.tsx'
import { SCHEMES, type ViewSchemeId } from '@/constants/grouping-schemes.ts'

export function ViewSchemeToggle({
	value,
	onChange,
}: {
	value: ViewSchemeId
	onChange: (id: ViewSchemeId) => void
}) {
	return (
		<div className="flex gap-2">
			{SCHEMES.map((scheme) => (
				<Button
					key={scheme.id}
					type="button"
					size="sm"
					variant={value === scheme.id ? 'default' : 'outline'}
					onClick={() => onChange(scheme.id as ViewSchemeId)}
				>
					{scheme.label}
				</Button>
			))}
		</div>
	)
}
