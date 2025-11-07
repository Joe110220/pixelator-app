import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Download, Upload, Eye, BarChart3, Copy, Check, Palette, X, Plus } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

interface BeadColor {
  hex: string;
  rgb: [number, number, number];
  count: number;
  percentage: number;
}

interface PaletteColor {
  hex: string;
  name?: string;
}

export default function PixelateImage() {
  const { user, loading: authLoading } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [pixelSize, setPixelSize] = useState<number>(10);
  const [isProcessing, setIsProcessing] = useState(false);
  const [beadPreviewUrl, setBeadPreviewUrl] = useState<string>("");
  const [beadColors, setBeadColors] = useState<BeadColor[]>([]);
  const [totalBeads, setTotalBeads] = useState(0);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [colorPalette, setColorPalette] = useState<PaletteColor[]>([]);
  const [newColorHex, setNewColorHex] = useState<string>("#FF0000");
  const [newColorName, setNewColorName] = useState<string>("");
  const [showPaletteForm, setShowPaletteForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const paletteFileInputRef = useRef<HTMLInputElement>(null);
  
  const generateBeadPreviewMutation = trpc.image.generateBeadPreviewWithPalette.useMutation();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
        setBeadPreviewUrl("");
        setBeadColors([]);
        setTotalBeads(0);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddColor = () => {
    if (!newColorHex) return;
    
    const newColor: PaletteColor = {
      hex: newColorHex,
      name: newColorName || newColorHex,
    };
    
    setColorPalette([...colorPalette, newColor]);
    setNewColorHex("#FF0000");
    setNewColorName("");
  };

  const handleRemoveColor = (index: number) => {
    setColorPalette(colorPalette.filter((_, i) => i !== index));
  };

  const handleImportPalette = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const lines = content.split("\n").filter(line => line.trim());
        const imported: PaletteColor[] = [];

        lines.forEach(line => {
          const [hex, name] = line.split(",").map(s => s.trim());
          if (hex && /^#[0-9A-Fa-f]{6}$/.test(hex)) {
            imported.push({ hex, name: name || hex });
          }
        });

        if (imported.length > 0) {
          setColorPalette(imported);
          alert(`成功匯入 ${imported.length} 種顏色`);
        } else {
          alert("未找到有效的顏色");
        }
      } catch (error) {
        alert("匯入失敗，請檢查文件格式");
      }
    };
    reader.readAsText(file);
  };

  const handleGenerateBeadPreview = async () => {
    if (!previewUrl || !user) return;

    setIsProcessing(true);
    try {
      const result = await generateBeadPreviewMutation.mutateAsync({
        imageUrl: previewUrl,
        pixelSize: Math.round(pixelSize),
        colorPalette: colorPalette.length > 0 ? colorPalette : undefined,
      });
      
      setBeadPreviewUrl(result.beadPreviewUrl);
      setBeadColors(result.beadColors);
      setTotalBeads(result.totalBeads);
    } catch (error) {
      console.error("Bead preview generation failed:", error);
      alert("拼豆預覽生成失敗，請重試");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyColor = (hex: string, index: number) => {
    navigator.clipboard.writeText(hex);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleExportCSV = () => {
    if (beadColors.length === 0) return;

    let csv = "色號(HEX),RGB值,數量,百分比\n";
    beadColors.forEach((color) => {
      csv += `${color.hex},"rgb(${color.rgb[0]},${color.rgb[1]},${color.rgb[2]})",${color.count},${color.percentage}%\n`;
    });

    const link = document.createElement("a");
    link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
    link.download = `bead-colors-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPalette = () => {
    if (colorPalette.length === 0) return;

    let content = colorPalette.map(c => `${c.hex},${c.name || c.hex}`).join("\n");
    
    const link = document.createElement("a");
    link.href = `data:text/plain;charset=utf-8,${encodeURIComponent(content)}`;
    link.download = `color-palette-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">拼豆像素化工具</h1>
          <p className="text-gray-600">將您的圖片轉換為拼豆設計，支援自訂顏色集</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Section */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>上傳圖片</CardTitle>
              <CardDescription>選擇一張圖片開始轉換</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mx-auto mb-2 text-gray-400" size={32} />
                <p className="text-gray-600 font-medium">點擊或拖放圖片</p>
                <p className="text-sm text-gray-500">支援 JPG、PNG、GIF 等格式</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {previewUrl && (
                <div className="space-y-2">
                  <Label>原始圖片預覽</Label>
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full rounded-lg border border-gray-200 max-h-64 object-contain"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Control Section */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>拼豆設定</CardTitle>
              <CardDescription>調整像素大小並選擇顏色集</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Pixel Size */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label htmlFor="pixel-size">像素大小</Label>
                  <span className="text-2xl font-bold text-blue-600">{Math.round(pixelSize)}</span>
                </div>
                <Slider
                  id="pixel-size"
                  min={1}
                  max={100}
                  step={1}
                  value={[pixelSize]}
                  onValueChange={(value) => setPixelSize(value[0])}
                  className="w-full"
                />
                <p className="text-sm text-gray-500">
                  {pixelSize <= 20 && "細緻的像素效果"}
                  {pixelSize > 20 && pixelSize <= 50 && "中等的像素效果"}
                  {pixelSize > 50 && "粗糙的像素效果"}
                </p>
              </div>

              {/* Color Palette Info */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Palette size={16} />
                    顏色集
                  </Label>
                  <span className="text-sm font-semibold text-purple-600">
                    {colorPalette.length} 種顏色
                  </span>
                </div>
                {colorPalette.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {colorPalette.map((color, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1 bg-gray-100 rounded px-2 py-1"
                      >
                        <div
                          className="w-4 h-4 rounded border border-gray-300"
                          style={{ backgroundColor: color.hex }}
                        />
                        <span className="text-xs font-mono">{color.hex}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Color Palette Actions */}
              <div className="space-y-2">
                <Button
                  onClick={() => setShowPaletteForm(!showPaletteForm)}
                  variant="outline"
                  className="w-full"
                >
                  <Plus size={16} className="mr-2" />
                  {showPaletteForm ? "隱藏" : "新增顏色"}
                </Button>

                {showPaletteForm && (
                  <div className="space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={newColorHex}
                        onChange={(e) => setNewColorHex(e.target.value)}
                        className="w-16 h-10"
                      />
                      <Input
                        type="text"
                        placeholder="顏色名稱（可選）"
                        value={newColorName}
                        onChange={(e) => setNewColorName(e.target.value)}
                        className="flex-1"
                      />
                      <Button onClick={handleAddColor} size="sm">
                        新增
                      </Button>
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => paletteFileInputRef.current?.click()}
                  variant="outline"
                  className="w-full"
                >
                  <Upload size={16} className="mr-2" />
                  匯入顏色集
                </Button>
                <input
                  ref={paletteFileInputRef}
                  type="file"
                  accept=".txt,.csv"
                  onChange={handleImportPalette}
                  className="hidden"
                />

                {colorPalette.length > 0 && (
                  <Button
                    onClick={handleExportPalette}
                    variant="outline"
                    className="w-full"
                  >
                    <Download size={16} className="mr-2" />
                    導出顏色集
                  </Button>
                )}

                {colorPalette.length > 0 && (
                  <Button
                    onClick={() => setColorPalette([])}
                    variant="outline"
                    className="w-full text-red-600 hover:text-red-700"
                  >
                    <X size={16} className="mr-2" />
                    清除顏色集
                  </Button>
                )}
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerateBeadPreview}
                disabled={!previewUrl || isProcessing}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={20} />
                    生成中...
                  </>
                ) : (
                  <>
                    <Eye className="mr-2" size={20} />
                    生成拼豆預覽
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Bead Preview Section */}
        {beadPreviewUrl && (
          <Card className="mt-6 shadow-lg border-purple-200 bg-purple-50">
            <CardHeader>
              <CardTitle className="text-purple-900">拼豆預覽</CardTitle>
              <CardDescription>您的拼豆成品預覽效果</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center">
                <img
                  src={beadPreviewUrl}
                  alt="Bead Preview"
                  className="rounded-lg border-2 border-purple-300 max-h-96 object-contain shadow-lg"
                />
              </div>
              <Button
                onClick={() => handleDownload(beadPreviewUrl, `bead-preview-${Date.now()}.png`)}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-6 text-lg"
              >
                <Download className="mr-2" size={20} />
                下載拼豆預覽
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Bead Color Statistics Section */}
        {beadColors.length > 0 && (
          <Card className="mt-6 shadow-lg border-green-200 bg-green-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-green-900 flex items-center gap-2">
                    <BarChart3 size={24} />
                    拼豆色號統計
                  </CardTitle>
                  <CardDescription>
                    總計 {totalBeads} 顆拼豆，{beadColors.length} 種顏色
                    {colorPalette.length > 0 && " （已按顏色集匹配）"}
                  </CardDescription>
                </div>
                <Button
                  onClick={handleExportCSV}
                  variant="outline"
                  className="bg-white hover:bg-gray-100"
                >
                  <Download size={16} className="mr-2" />
                  導出 CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {beadColors.map((color, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-3 bg-white rounded-lg border border-green-200 hover:border-green-400 transition"
                  >
                    {/* Color Swatch */}
                    <div
                      className="w-12 h-12 rounded-lg border-2 border-gray-300 shadow-sm flex-shrink-0"
                      style={{
                        backgroundColor: color.hex,
                      }}
                    />

                    {/* Color Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <code className="text-sm font-mono font-bold text-gray-800">
                          {color.hex}
                        </code>
                        <button
                          onClick={() => handleCopyColor(color.hex, index)}
                          className="p-1 hover:bg-gray-200 rounded transition"
                          title="複製色號"
                        >
                          {copiedIndex === index ? (
                            <Check size={16} className="text-green-600" />
                          ) : (
                            <Copy size={16} className="text-gray-600" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-gray-600">
                        RGB({color.rgb[0]}, {color.rgb[1]}, {color.rgb[2]})
                      </p>
                    </div>

                    {/* Count and Percentage */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-bold text-green-700">{color.count}</p>
                      <p className="text-xs text-gray-600">{color.percentage}%</p>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                      <div
                        className="h-full bg-green-500 transition-all duration-300"
                        style={{ width: `${color.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary Stats */}
              <div className="mt-6 pt-6 border-t border-green-200 grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-700">{totalBeads}</p>
                  <p className="text-sm text-gray-600">總拼豆數</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-700">{beadColors.length}</p>
                  <p className="text-sm text-gray-600">顏色種類</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-700">
                    {Math.round((beadColors[0]?.count / totalBeads) * 100)}%
                  </p>
                  <p className="text-sm text-gray-600">最多顏色</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
