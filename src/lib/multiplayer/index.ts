/**
 * JPDOC: マルチプレイヤー／観戦の公開面。
 */
export { P2PRoom, defaultIceServers } from "./p2p";
export type {
  PeerInfo,
  P2PRoomOptions,
  SignalKind,
  PeerRow,
  SignalRow,
  RtcPollResponse,
} from "./p2p";
export { P2PSync, makeEventId } from "./sync";
export type { SyncRole, SyncWire, P2PSyncOptions } from "./sync";
export {
  buildSpectatorFrame,
  isSpectatorFrame,
} from "./spectator-frame";
export type {
  SpectatorFrame,
  SpectatorEnemy,
  SpectatorBullet,
} from "./spectator-frame";
