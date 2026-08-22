/**
 * JPDOC: バージョン履歴データ。サウンドテストと Extra が読む。
 */
/** SWIPE FORCE version & changelog (newest first). */

export const APP_VERSION = "1.9.0";

export type VersionEntry = {
  version: string;
  date: string; // YYYY-MM-DD
  title: string;
  notes: string[];
};

export const VERSION_HISTORY: VersionEntry[] = [
  {
    version: "1.9.0",
    date: "2026-08-16",
    title: "遊び方・バナー・二カ国語",
    notes: [
      "表示言語 JA/EN（ブラウザ言語、OPTIONSで切替）",
      "遊び方ページとチュートリアル（1面クリアで達成）",
      "タイトル余白のパートナーバナー・バナーエディタ",
      "広告CLEAR画面のYouTubeチャンネルリンク（デフォルト出さない）",
      "広告まわりのファイル名を media/partner に変更（広告ブロッカー対策）",
    ],
  },
  {
    version: "1.8.0",
    date: "2026-08-11",
    title: "広告視聴・広告主ポータル",
    notes: [
      "YouTube広告視聴でコンティニューコイン（時限はしご・JST時リセット）",
      "広告管理（運営）と広告主ポータル /partner（連携必須）",
      "プリペイドコード発行・チャージ（1秒視聴＝1クレジット）",
      "クレジット0の広告主動画は非表示／運営広告は無料・低優先",
      "表示優先：広告主動画を優先し、新しい or 再生短い軸で抽選",
      "管理者は全広告閲覧・ポータルURLコピー／広告主は自分の分のみ",
    ],
  },
  {
    version: "1.7.0",
    date: "2026-08-10",
    title: "プロモ制限・ショップ・深海のバス",
    notes: [
      "プロモコードに期限・使用上限を設定可能",
      "プロモ使用回数の集計を管理画面に表示",
      "武器ショップのティア開放を修正（連携でT2/T3スキップしない）",
      "NORMAL価格倍率の逆転を修正（T1×3→T4×81）",
      "ボス曲「深海のバス」を三和音オルゴール風に",
      "アカウント連携の保存にプレイ時間を追加",
      "Extra 配下の Esc 戻り・サウンドテスト修正",
    ],
  },
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
    date: "2026-08-09",
    title: "シェア・サウンド・プロフィール",
    notes: [
      "シェアミッションとコンティニューコイン",
      "サウンドテスト・プロフィール・スタッツ",
    ],
  },
  {
    version: "1.4.0",
    date: "2026-08-08",
    title: "安定化",
    notes: ["プレイ周りの改善"],
  },
  {
    version: "1.3.0",
    date: "2026-08-07",
    title: "コンテンツ拡張",
    notes: ["ステージ・ボス周り"],
  },
  {
    version: "1.2.0",
    date: "2026-08-06",
    title: "UI改善",
    notes: ["タイトル・オプション"],
  },
  {
    version: "1.1.0",
    date: "2026-08-05",
    title: "初期アップデート",
    notes: ["基本機能の強化"],
  },
  {
    version: "1.0.0",
    date: "2026-08-01",
    title: "リリース",
    notes: ["SWIPE FORCE 初版"],
  },
];

export function versionShortLabel(): string {
  return `v${APP_VERSION}`;
}
