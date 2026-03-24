'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Check, Copy, ExternalLink, Code } from 'lucide-react'
import { toast } from 'sonner'

interface WidgetEmbedCodeProps {
  widgetUrl: string
  iframeCode: string
  businessSlug: string
}

export function WidgetEmbedCode({ widgetUrl, iframeCode, businessSlug }: WidgetEmbedCodeProps) {
  const [copiedIframe, setCopiedIframe] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  const handleCopyIframe = async () => {
    await navigator.clipboard.writeText(iframeCode)
    setCopiedIframe(true)
    toast.success('Iframe code copied to clipboard')
    setTimeout(() => setCopiedIframe(false), 2000)
  }

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(widgetUrl)
    setCopiedLink(true)
    toast.success('Widget URL copied to clipboard')
    setTimeout(() => setCopiedLink(false), 2000)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Embed Options */}
      <div className="space-y-6">
        <Tabs defaultValue="iframe" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted">
            <TabsTrigger value="iframe" className="data-[state=active]:bg-background">
              Iframe Embed
            </TabsTrigger>
            <TabsTrigger value="link" className="data-[state=active]:bg-background">
              Direct Link
            </TabsTrigger>
          </TabsList>

          <TabsContent value="iframe" className="mt-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base text-foreground">Iframe Code</CardTitle>
                <CardDescription>
                  Copy this code and paste it into your website HTML
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <pre className="p-4 bg-muted rounded-lg text-sm text-foreground overflow-x-auto">
                    <code>{iframeCode}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="absolute top-2 right-2"
                    onClick={handleCopyIframe}
                  >
                    {copiedIframe ? (
                      <>
                        <Check className="w-4 h-4 mr-1" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>

                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-2">Instructions:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Copy the iframe code above</li>
                    <li>Paste it into your website&apos;s HTML</li>
                    <li>Adjust the height if needed</li>
                    <li>Save and publish your changes</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="link" className="mt-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base text-foreground">Direct Link</CardTitle>
                <CardDescription>
                  Share this link directly with customers or use in marketing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <pre className="p-4 bg-muted rounded-lg text-sm text-foreground overflow-x-auto">
                    <code>{widgetUrl}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="absolute top-2 right-2"
                    onClick={handleCopyLink}
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-4 h-4 mr-1" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>

                <Button asChild className="w-full" variant="outline">
                  <a href={widgetUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open Widget Preview
                  </a>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base text-foreground flex items-center gap-2">
              <Code className="w-5 h-5 text-primary" />
              Your Widget ID
            </CardTitle>
          </CardHeader>
          <CardContent>
            <code className="px-3 py-2 bg-muted rounded text-primary font-mono">
              {businessSlug}
            </code>
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
