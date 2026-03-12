import { Route } from './+types/juxtapose'
import { getOrCreateParticipantSession } from '@/utils/participant-session.server.ts'
import { getParticipantAllocation } from '@/utils/participants-db.server.ts'
import { href, redirect } from 'react-router'

export async function loader({ request }: Route.LoaderArgs) {
	const { headers, isNew, participantId } =
		await getOrCreateParticipantSession(request)

	if (!isNew) {
		const allocation = await getParticipantAllocation(participantId)

		if (allocation) {
			return { allocation }
		}
	}

	return redirect(
		href('/allocate/:year', { year: new Date().getFullYear().toString() }),
		{ headers },
	)
}

export default function JuxtaposeRoute({ loaderData }: Route.ComponentProps) {
	const { allocation } = loaderData

	console.log('Allocation', allocation)

	return (
		<div>
			<h1>You & the US Fiscal Budget</h1>
		</div>
	)
}
