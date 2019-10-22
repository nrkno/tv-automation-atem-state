import { Commands as AtemCommands } from 'atem-connection'
import { MixEffect } from '../../'
import { UpstreamKeyer } from 'atem-connection/dist/state/video/upstreamKeyers'
import * as _ from 'underscore'

import { resolveDVEKeyerState } from './dveKeyer'
import { resolveChromaKeyerState } from './chromaKeyer'
import { resolveLumaKeyerState } from './lumaKeyer'
import { resolvePatternKeyerState } from './patternKeyer'
import { getAllKeysNumber, diffObject } from '../../util'

export function resolveUpstreamKeyerState (mixEffectId: number, oldMixEffect: MixEffect, newMixEffect: MixEffect): Array<AtemCommands.ISerializableCommand> {
	const commands: Array<AtemCommands.ISerializableCommand> = []

	for (const upstreamKeyerId of getAllKeysNumber(oldMixEffect.upstreamKeyers, newMixEffect.upstreamKeyers)) {
		const oldKeyer = oldMixEffect.getUpstreamKeyer(upstreamKeyerId, true)
		const newKeyer = newMixEffect.getUpstreamKeyer(upstreamKeyerId, true)

		commands.push(...resolveUpstreamKeyerMaskState(mixEffectId, upstreamKeyerId, oldKeyer, newKeyer))
		commands.push(...resolveDVEKeyerState(mixEffectId, upstreamKeyerId, oldKeyer, newKeyer))
		commands.push(...resolveChromaKeyerState(mixEffectId, upstreamKeyerId, oldKeyer, newKeyer))
		commands.push(...resolveLumaKeyerState(mixEffectId, upstreamKeyerId, oldKeyer, newKeyer))
		commands.push(...resolvePatternKeyerState(mixEffectId, upstreamKeyerId, oldKeyer, newKeyer))

		if (oldKeyer.fillSource !== newKeyer.fillSource) {
			commands.push(new AtemCommands.MixEffectKeyFillSourceSetCommand(mixEffectId, upstreamKeyerId, newKeyer.fillSource))
		}
		if (oldKeyer.cutSource !== newKeyer.cutSource) {
			commands.push(new AtemCommands.MixEffectKeyCutSourceSetCommand(mixEffectId, upstreamKeyerId, newKeyer.cutSource))
		}

		const typeProps = diffObject(_.pick(oldKeyer, 'mixEffectKeyType', 'flyEnabled'), _.pick(newKeyer, 'mixEffectKeyType', 'flyEnabled'))
		if (typeProps) {
			const command = new AtemCommands.MixEffectKeyTypeSetCommand(mixEffectId, upstreamKeyerId)
			command.updateProps(typeProps)
			commands.push(command)
		}

		if (oldKeyer.onAir !== newKeyer.onAir) {
			commands.push(new AtemCommands.MixEffectKeyOnAirCommand(mixEffectId, upstreamKeyerId, newKeyer.onAir))
		}
	}

	return commands
}

export function resolveUpstreamKeyerMaskState (_mixEffectId: number, _upstreamKeyerId: number, _oldKeyer: UpstreamKeyer, _newKeyer: UpstreamKeyer): Array<AtemCommands.ISerializableCommand> {
	const commands: Array<AtemCommands.ISerializableCommand> = []

	// TODO - fix this
	// const props = diffObject<UpstreamKeyerMaskSettings>(oldKeyer, newKeyer)

	// if (props) {
	// 	const command = new AtemCommands.MixEffectKeyMaskSetCommand(mixEffectId, upstreamKeyerId)
	// 	command.updateProps(props)
	// 	commands.push(command)
	// }

	return commands
}
