import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles, Download, Zap } from "lucide-react";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { useLocation } from "wouter";

/**
 * Landing page for the Pixelator app
 */
export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            {APP_LOGO && <img src={APP_LOGO} alt="Logo" className="h-8 w-8" />}
            <h1 className="text-2xl font-bold text-gray-900">{APP_TITLE}</h1>
          </div>
          <div className="flex gap-2">
            {isAuthenticated ? (
              <>
                <Button
                  onClick={() => navigate("/pixelate")}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  開始使用
                </Button>
                <Button
                  onClick={logout}
                  variant="outline"
                >
                  登出
                </Button>
              </>
            ) : (
              <Button
                onClick={() => (window.location.href = getLoginUrl())}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                登入
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
            拼豆像素化工具
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            輕鬆將您的照片轉換為像素藝術，完美適配拼豆手作專案
          </p>
          {isAuthenticated ? (
            <Button
              onClick={() => navigate("/pixelate")}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-6"
            >
              <Sparkles className="mr-2" size={24} />
              開始像素化
            </Button>
          ) : (
            <Button
              onClick={() => (window.location.href = getLoginUrl())}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-6"
            >
              登入開始使用
            </Button>
          )}
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <Card className="shadow-lg hover:shadow-xl transition">
            <CardHeader>
              <Zap className="text-blue-600 mb-2" size={32} />
              <CardTitle>快速處理</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                即時預覽像素化效果，快速調整參數直到滿意為止
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition">
            <CardHeader>
              <Sparkles className="text-blue-600 mb-2" size={32} />
              <CardTitle>靈活調整</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                從細緻到粗糙，調整像素大小以達到完美效果
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition">
            <CardHeader>
              <Download className="text-blue-600 mb-2" size={32} />
              <CardTitle>輕鬆下載</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                下載高品質的像素化圖片，用於您的拼豆專案
              </p>
            </CardContent>
          </Card>
        </div>

        {/* How it works */}
        <div className="bg-white rounded-lg shadow-lg p-8 md:p-12">
          <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            如何使用
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                1
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">上傳圖片</h4>
              <p className="text-gray-600 text-sm">
                選擇您想要像素化的圖片
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                2
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">調整參數</h4>
              <p className="text-gray-600 text-sm">
                使用滑桿調整像素大小
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                3
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">預覽效果</h4>
              <p className="text-gray-600 text-sm">
                即時查看像素化結果
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                4
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">下載使用</h4>
              <p className="text-gray-600 text-sm">
                下載圖片用於拼豆專案
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-gray-400">
            © 2024 拼豆像素化工具。為您的創意手作賦能。
          </p>
        </div>
      </footer>
    </div>
  );
}
