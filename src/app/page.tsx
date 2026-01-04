import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Zap, Image, MessageSquare, Hash } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]" />
      
      {/* Hero Section */}
      <div className="relative">
        <header className="container mx-auto px-4 py-6">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                <span className="text-xl font-bold text-white">職</span>
              </div>
              <span className="text-xl font-bold text-white">Post Shokunin AI</span>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10" asChild>
                <Link href="/login">ログイン</Link>
              </Button>
              <Button className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600" asChild>
                <Link href="/login">無料で始める</Link>
              </Button>
            </div>
          </nav>
        </header>

        <main className="container mx-auto px-4 py-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white/80 text-sm mb-8">
            <Sparkles className="h-4 w-4" />
            <span>AIが投稿を一括生成</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight">
            SNS投稿を
            <br />
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              プロ品質で一括生成
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-10">
            X、Instagram、TikTok、Googleビジネスプロフィール、note向けに
            最適化された投稿文・画像・ハッシュタグを1回の入力で生成。
            小規模事業者のSNS運用を効率化します。
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="h-14 px-8 text-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600"
              asChild
            >
              <Link href="/login">
                無料で始める
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <button 
              className="h-14 px-8 text-lg font-medium rounded-md border border-white/20 bg-transparent text-white hover:bg-white/10 transition-colors"
            >
              デモを見る
            </button>
          </div>

          {/* Platform logos */}
          <div className="mt-16 flex flex-wrap justify-center gap-8 text-white/50">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded bg-white/10 flex items-center justify-center">
                <span className="font-bold">𝕏</span>
              </div>
              <span>X (Twitter)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <span className="text-sm">IG</span>
              </div>
              <span>Instagram</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded bg-black flex items-center justify-center">
                <span className="text-sm">TT</span>
              </div>
              <span>TikTok</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded bg-blue-500 flex items-center justify-center">
                <span className="text-sm font-bold">G</span>
              </div>
              <span>Google</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded bg-green-500 flex items-center justify-center">
                <span className="text-sm font-bold">n</span>
              </div>
              <span>note</span>
            </div>
          </div>
        </main>
      </div>

      {/* Features Section */}
      <section className="relative py-20 bg-white/5">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
            一度の入力で、全てを生成
          </h2>
          <p className="text-white/60 text-center mb-16 max-w-2xl mx-auto">
            各プラットフォームに最適化されたコンテンツを自動生成。
            ブランドの一貫性を保ちながら、効率的にSNS運用を行えます。
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center mb-6">
                <Image className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">プロ品質の画像生成</h3>
              <p className="text-white/60">
                テンプレート感のない、ブランドに合わせたオリジナル画像を生成。
                余白・整列・可読性を自動最適化。
              </p>
            </div>

            <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-6">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">媒体別に最適化された文章</h3>
              <p className="text-white/60">
                Xの短文からnoteの長文まで、各プラットフォームの特性に
                合わせた文章構成を自動生成。
              </p>
            </div>

            <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-6">
                <Hash className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">ハッシュタグ最適化</h3>
              <p className="text-white/60">
                プラットフォームごとに最適な数と粒度のハッシュタグを
                自動提案。リーチを最大化。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white/80 text-sm mb-8">
            <Zap className="h-4 w-4" />
            <span>月100件まで無料</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            今すぐSNS運用を効率化
          </h2>
          
          <p className="text-white/60 mb-10 max-w-xl mx-auto">
            クレジットカード不要。まずは無料でお試しください。
          </p>

          <Button 
            size="lg" 
            className="h-14 px-8 text-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600"
            asChild
          >
            <Link href="/login">
              無料で始める
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-white/10 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                <span className="text-sm font-bold text-white">職</span>
              </div>
              <span className="text-white font-semibold">Post Shokunin AI</span>
            </div>
            
            <div className="flex items-center gap-6 text-white/50 text-sm">
              <Link href="/terms" className="hover:text-white">利用規約</Link>
              <Link href="/privacy" className="hover:text-white">プライバシーポリシー</Link>
              <Link href="/contact" className="hover:text-white">お問い合わせ</Link>
            </div>
            
            <p className="text-white/30 text-sm">
              © 2025 Post Shokunin AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
