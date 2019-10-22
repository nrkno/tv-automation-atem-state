import * as ME from '../mixEffect'
import { State as StateObject, Enums, MixEffect, Defaults } from '../../'
import { Commands, Enums as AtemEnums } from 'atem-connection'
import { jsonClone } from '../../util'

const STATE1 = new StateObject()
const ME1 = STATE1.video.getMe(0) as MixEffect
const STATE2 = new StateObject()
const ME2 = STATE2.video.getMe(0) as MixEffect

test('Unit: mix effect: same state gives no commands', function () {
	// same state gives no commands:
	const commands = ME.resolveMixEffectsState(STATE1, STATE1)
	expect(commands).toHaveLength(0)
})

test('Unit: mix effect: same input gives no commands', function () {
	ME1.input = 1
	ME1.transition = Enums.TransitionStyle.CUT

	ME2.input = 1
	ME2.transition = Enums.TransitionStyle.CUT

	const commands = ME.resolveMixEffectsState(STATE1, STATE1)
	expect(commands).toHaveLength(0)

	delete ME1.input
	delete ME1.transition
	delete ME2.input
	delete ME2.transition
})

test('Unit: mix effect: program input', function () {
	ME2.programInput = 1
	const commands = ME.resolveMixEffectsState(STATE1, STATE2) as Array<Commands.ProgramInputCommand>
	expect(commands).toHaveLength(1)

	expect(commands[0].constructor.name).toEqual('ProgramInputCommand')
	expect(commands[0].mixEffect).toEqual(0)
	expect(commands[0].properties).toEqual({
		source: 1
	})

	ME2.programInput = 0
})

test('Unit: mix effect: preview input', function () {
	ME2.previewInput = 1
	const commands = ME.resolveMixEffectsState(STATE1, STATE2) as Array<Commands.PreviewInputCommand>
	expect(commands).toHaveLength(1)

	expect(commands[0].constructor.name).toEqual('PreviewInputCommand')
	expect(commands[0].mixEffect).toEqual(0)
	expect(commands[0].properties).toEqual({
		source: 1
	})

	ME2.previewInput = 0
})

test('Unit: mix effect: cut command', function () {
	ME2.input = 1
	ME2.transition = Enums.TransitionStyle.CUT
	const commands = ME.resolveMixEffectsState(STATE1, STATE2) as Array<Commands.PreviewInputCommand>
	expect(commands).toHaveLength(2)

	expect(commands[0].constructor.name).toEqual('PreviewInputCommand')
	expect(commands[0].mixEffect).toEqual(0)
	expect(commands[0].properties).toEqual({
		source: 1
	})

	expect(commands[1].constructor.name).toEqual('CutCommand')
	expect(commands[1].mixEffect).toEqual(0)

	delete ME2.input
	delete ME2.transition
})

test('Unit: mix effect: dummy command', function () {
	ME2.input = 1
	ME2.transition = Enums.TransitionStyle.DUMMY
	const commands = ME.resolveMixEffectsState(STATE1, STATE2) as Array<Commands.PreviewInputCommand>
	expect(commands).toHaveLength(1)

	expect(commands[0].constructor.name).toEqual('PreviewInputCommand')
	expect(commands[0].mixEffect).toEqual(0)
	expect(commands[0].properties).toEqual({
		source: 1
	})

	// Dummy implies that something else will perform the cut. (eg a macro)

	delete ME2.input
	delete ME2.transition
})

test('Unit: mix effect: auto command', function () {
	ME2.input = 1
	ME2.transition = Enums.TransitionStyle.MIX
	const commands = ME.resolveMixEffectsState(STATE1, STATE2) as Array<Commands.PreviewInputCommand | Commands.TransitionPositionCommand>
	expect(commands).toHaveLength(3)

	expect(commands[0].constructor.name).toEqual('PreviewInputCommand')
	expect(commands[0].mixEffect).toEqual(0)
	expect(commands[0].properties).toEqual({
		source: 1
	})

	expect(commands[1].constructor.name).toEqual('TransitionPositionCommand')
	expect(commands[1].mixEffect).toEqual(0)
	expect(commands[1].properties).toEqual({
		handlePosition: 0
	})

	expect(commands[2].constructor.name).toEqual('AutoTransitionCommand')
	expect(commands[2].mixEffect).toEqual(0)

	ME2.input = 0
})

test('Unit: mix effect: auto command, new transition', function () {
	ME2.input = 1
	ME2.transition = Enums.TransitionStyle.WIPE
	const commands = ME.resolveMixEffectsState(STATE1, STATE2) as Array<Commands.PreviewInputCommand | Commands.TransitionPositionCommand>
	expect(commands).toHaveLength(4)

	expect(commands[0].constructor.name).toEqual('PreviewInputCommand')
	expect(commands[0].mixEffect).toEqual(0)
	expect(commands[0].properties).toEqual({
		source: 1
	})

	expect(commands[1].constructor.name).toEqual('TransitionPropertiesCommand')
	expect(commands[1].mixEffect).toEqual(0)
	expect(commands[1].properties).toEqual({
		style: Enums.TransitionStyle.WIPE
	})

	expect(commands[2].constructor.name).toEqual('TransitionPositionCommand')
	expect(commands[2].mixEffect).toEqual(0)
	expect(commands[2].properties).toEqual({
		handlePosition: 0
	})

	expect(commands[3].constructor.name).toEqual('AutoTransitionCommand')
	expect(commands[3].mixEffect).toEqual(0)

	ME2.input = 0
})

test('Unit: mix effect: transition preview', function () {
	ME2.transitionPreview = true
	const commands = ME.resolveMixEffectsState(STATE1, STATE2) as Array<Commands.PreviewTransitionCommand>
	expect(commands).toHaveLength(1)

	expect(commands[0].constructor.name).toEqual('PreviewTransitionCommand')
	expect(commands[0].mixEffect).toEqual(0)

	ME2.transitionPreview = false
})

test('Unit: mix effect: transition position', function () {
	ME2.inTransition = true
	ME2.transitionPosition = 500
	const commands = ME.resolveMixEffectsState(STATE1, STATE2) as Array<Commands.TransitionPositionCommand>
	expect(commands).toHaveLength(1)

	expect(commands[0].constructor.name).toEqual('TransitionPositionCommand')
	expect(commands[0].mixEffect).toEqual(0)
	expect(commands[0].properties).toEqual({
		handlePosition: 500
	})

	ME2.inTransition = false
	ME2.transitionPosition = 0
})

test('Unit: mix effect: from transition, to no transition', function () {
	ME1.inTransition = true
	ME1.transitionPosition = 500
	const commands = ME.resolveMixEffectsState(STATE1, STATE2) as Array<Commands.TransitionPositionCommand>
	expect(commands).toHaveLength(1)

	expect(commands[0].constructor.name).toEqual('TransitionPositionCommand')
	expect(commands[0].mixEffect).toEqual(0)
	expect(commands[0].properties).toEqual({
		handlePosition: 10000
	})

	ME1.inTransition = false
	ME1.transitionPosition = 0
})

test('Unit: mix effect: transition properties', function () {
	ME2.transitionProperties.selection = 3
	ME2.transitionProperties.style = 1
	const commands = ME.resolveTransitionPropertiesState(0, ME1, ME2) as Array<Commands.TransitionPropertiesCommand>
	expect(commands).toHaveLength(1)

	expect(commands[0].constructor.name).toEqual('TransitionPropertiesCommand')
	expect(commands[0].mixEffect).toEqual(0)
	expect(commands[0].properties).toEqual({
		selection: 3,
		style: 1
	})

	ME2.transitionProperties.selection = 1
	ME2.transitionProperties.style = 0
})

test('Unit: mix effect: transition settings: dip', function () {
	ME2.transitionSettings.dip = {
		input: 1,
		rate: 50
	}
	const commands = ME.resolveTransitionSettingsState(0, ME1, ME2) as Array<Commands.TransitionDipCommand>
	expect(commands).toHaveLength(1)

	expect(commands[0].constructor.name).toEqual('TransitionDipCommand')
	expect(commands[0].mixEffect).toEqual(0)
	expect(commands[0].properties).toEqual({
		input: 1,
		rate: 50
	})

	delete ME2.transitionSettings.dip
})

test('Unit: mix effect: transition settings: DVE', function () {
	ME2.transitionSettings.DVE = {
		rate: 50,
		logoRate: 50,
		style: AtemEnums.DVEEffect.PushBottom,
		fillSource: 2,
		keySource: 4,

		enableKey: true,
		preMultiplied: true,
		clip: 1,
		gain: 1,
		invertKey: true,
		reverse: true,
		flipFlop: true
	}
	const commands = ME.resolveTransitionSettingsState(0, ME1, ME2) as Array<Commands.TransitionDVECommand>

	expect(commands[0].constructor.name).toEqual('TransitionDVECommand')
	expect(commands[0].mixEffect).toEqual(0)
	expect(commands[0].flag).toEqual(4095)
	expect(commands[0].properties).toEqual({
		rate: 50,
		logoRate: 50,
		style: AtemEnums.DVEEffect.PushBottom,
		fillSource: 2,
		keySource: 4,

		enableKey: true,
		preMultiplied: true,
		clip: 1,
		gain: 1,
		invertKey: true,
		reverse: true,
		flipFlop: true
	} as {})

	delete ME2.transitionSettings.DVE
})

test('Unit: mix effect: transition settings: mix', function () {
	ME2.transitionSettings.mix = jsonClone(Defaults.Video.MixTransitionSettings)
	ME2.transitionSettings.mix.rate = 50
	const commands = ME.resolveTransitionSettingsState(0, ME1, ME2) as Array<Commands.TransitionMixCommand>

	expect(commands[0].constructor.name).toEqual('TransitionMixCommand')
	expect(commands[0].mixEffect).toEqual(0)
	expect(commands[0].properties).toEqual({
		rate: 50
	})

	delete ME2.transitionSettings.mix
})

test('Unit: mix effect: transition settings: stinger', function () {
	ME2.transitionSettings.stinger = {
		source: 1,
		preMultipliedKey: true,

		clip: 1,
		gain: 1, // 0...1000
		invert: true,

		preroll: 10,
		clipDuration: 50,
		triggerPoint: 25,
		mixRate: 25
	}
	const commands = ME.resolveTransitionSettingsState(0, ME1, ME2) as Array<Commands.TransitionStingerCommand>

	expect(commands[0].constructor.name).toEqual('TransitionStingerCommand')
	expect(commands[0].mixEffect).toEqual(0)
	expect(commands[0].properties).toEqual({
		source: 1,
		preMultipliedKey: true,

		clip: 1,
		gain: 1, // 0...1000
		invert: true,

		preroll: 10,
		clipDuration: 50,
		triggerPoint: 25,
		mixRate: 25
	})

	delete ME2.transitionSettings.stinger
})

test('Unit: mix effect: transition settings: wipe', function () {
	ME2.transitionSettings.wipe = {
		rate: 50,
		pattern: AtemEnums.Pattern.HorizontalBarnDoor,
		borderWidth: 1,
		borderInput: 1,
		symmetry: 1,
		borderSoftness: 1,
		xPosition: 1,
		yPosition: 1,
		reverseDirection: true,
		flipFlop: true
	}
	const commands = ME.resolveTransitionSettingsState(0, ME1, ME2) as Array<Commands.TransitionWipeCommand>

	expect(commands[0].constructor.name).toEqual('TransitionWipeCommand')
	expect(commands[0].mixEffect).toEqual(0)
	expect(commands[0].properties).toEqual({
		rate: 50,
		pattern: AtemEnums.Pattern.HorizontalBarnDoor,
		borderWidth: 1,
		borderInput: 1,
		symmetry: 1,
		borderSoftness: 1,
		xPosition: 1,
		yPosition: 1,
		reverseDirection: true,
		flipFlop: true
	})

	delete ME2.transitionSettings.wipe
})
