/** SWIPE FORCE version & changelog (newest first). */

export const APP_VERSION = "1.6.0";

export type VersionEntry = {
  version: string;
  date: string; // YYYY-MM-DD
  title: string;
  notes: string[];
};

export const VERSION_HISTORY: VersionEntry[] = [
  {
    version: "1.6.0",
    date: "2026-08-10",
    title: "バッグ・プロモ・管理者",
    notes: [
      "使い捨てアイテム（STAGE TICKET / PTS×5×10 / +5000）",
      "バッグ画面・ログインボーナス・プロモコード配布",
      "プロモ管理UIと追加管理者の任命（固定管理者あり）",
      "プレイ中サイドレールから BAG / キーBで使用",
      "AUTO SHOP 設定・オプションからタイトルへ戻る",
      "キーボード移動（WASD / 矢印）を復元",
      "カスタムドメイン認証（Invalid origin）対応",
    ],
  },
  {
    version: "1.5.0",
    date: "2026-08-10",
    title: "プロフ・統計画面",
    notes: [
      "連携特典プロフィール（表示名 / 自己紹介 / シェア文40字）",
      "自己紹介URLの自動リンクと2段クッション",
      "クエリ # & = を許可",
      "ゲーム情報（プレイ時間・ヘルプ回数・最高到達・EASY強化）",
      "タイトルロゴ下にバージョン表示更新",
    ],
  },
  {
    version: "1.4.0",
    date: "2026-08-10",
    title: "ボス曲リファイン & 履歴",
    notes: [
      "全ボス曲を曲名寄せアレンジに整理",
      "星屑のフーガを単旋律のフーガ提示に",
      "決意の和声をフォルマント声合成に",
      "バージョン履歴ページを追加",
      "タイトルにバージョン表示",
    ],
  },
  {
    version: "1.3.0",
    date: "2026-08-10",
    title: "サウンドテスト拡張",
    notes: [
      "曲ごとのコメント（最大2000文字）",
      "アレンジ／演奏共有とURL最大20件",
      "2段クッションURLと開封後のみ評価",
      "好き／嫌い・定型報告（連携必須）",
    ],
  },
  {
    version: "1.2.0",
    date: "2026-08-10",
    title: "連携特典と進行シェア",
    notes: [
      "アカウント連携・クラウド引き継ぎ",
      "OPTレーザー／火炎放射・強化Lv20",
      "サウンドテスト（ステージ／ボス／旧曲）",
      "ショップから進行中シェア",
    ],
  },
  {
    version: "1.1.0",
    date: "2026-08-09",
    title: "コンテニューコイン",
    notes: [
      "Xシェアからミッション達成でコイン",
      "1〜4面ボス段階ミッション",
      "インボックスとお礼メッセージ",
      "イージー強化引き継ぎ",
    ],
  },
  {
    version: "1.0.0",
    date: "2026-08-08",
    title: "SWIPE FORCE 初版",
    notes: [
      "スワイプ移動・自動連射シューティング",
      "パワーショップと段階強化",
      "64ボス・難易度 EASY／NORMAL",
      "オプション・武装ON/OFF・仮想スティック",
      "波形合成チップチューンBGM",
    ],
  },
];

export function versionShortLabel(): string {
  return `v${APP_VERSION}`;
}
