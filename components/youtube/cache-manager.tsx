"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, RefreshCw, Database } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { clearCache, getCacheStats } from "@/lib/cache-service"

export function CacheManager() {
  const [stats, setStats] = useState({
    videoDataCount: 0,
    summaryCount: 0,
    analysisCount: 0,
    totalSize: "0 KB",
  })
  const [isClearing, setIsClearing] = useState(false)
  const { toast } = useToast()

  // Get cache stats on mount and when cache changes
  const refreshStats = () => {
    const newStats = getCacheStats()
    setStats(newStats)
  }

  useEffect(() => {
    refreshStats()
  }, [])

  const handleClearCache = () => {
    setIsClearing(true)

    try {
      clearCache()
      refreshStats()

      toast({
        title: "Cache cleared",
        description: "All cached data has been successfully removed",
        duration: 3000,
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to clear cache",
        description: "An error occurred while clearing the cache",
        duration: 3000,
      })
    } finally {
      setIsClearing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Cache Management
        </CardTitle>
        <CardDescription>Manage cached data to improve performance and reduce API calls</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-muted rounded-lg p-4">
            <div className="text-2xl font-bold">{stats.videoDataCount}</div>
            <div className="text-sm text-muted-foreground">Cached Videos</div>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <div className="text-2xl font-bold">{stats.summaryCount}</div>
            <div className="text-sm text-muted-foreground">Cached Summaries</div>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <div className="text-2xl font-bold">{stats.analysisCount}</div>
            <div className="text-sm text-muted-foreground">Cached Analyses</div>
          </div>
        </div>
        <div className="mt-4 text-sm text-muted-foreground">
          Total cache size: <span className="font-medium">{stats.totalSize}</span>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" size="sm" onClick={refreshStats}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleClearCache}
          disabled={isClearing || stats.videoDataCount + stats.summaryCount + stats.analysisCount === 0}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          {isClearing ? "Clearing..." : "Clear Cache"}
        </Button>
      </CardFooter>
    </Card>
  )
}
