import * as React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { allTools, featuredTools } from '../utils/tools-data';

export function MainPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">DevToolsHub</h1>
        <p className="text-muted-foreground">
          Your one-stop solution for developer tools. Start with these popular features or explore
          more in the sidebar.
        </p>
      </div>

      <Tabs defaultValue="featured">
        <TabsList className="w-full">
          <TabsTrigger value="featured" className="flex-1">
            Featured Tools
          </TabsTrigger>
          <TabsTrigger value="all" className="flex-1">
            All Tools
          </TabsTrigger>
        </TabsList>

        <TabsContent value="featured" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredTools.map((tool) => (
              <Link
                key={tool.title}
                to={tool.url}
                className="block transform transition-all duration-200 hover:-translate-y-1"
              >
                <Card className="h-full hover:shadow-lg">
                  <div className="p-6 space-y-4">
                    <div
                      className={`w-12 h-12 rounded-lg ${tool.color} flex items-center justify-center`}
                    >
                      <tool.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{tool.title}</h3>
                      <p className="text-sm text-muted-foreground">{tool.description}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="all" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allTools.map((tool) => (
              <Link
                key={tool.title}
                to={tool.url}
                className="block transform transition-all duration-200 hover:-translate-y-1"
              >
                <Card className="h-full hover:shadow-lg">
                  <div className="p-6 space-y-4">
                    <div
                      className={`w-12 h-12 rounded-lg ${tool.color} flex items-center justify-center`}
                    >
                      <tool.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{tool.title}</h3>
                      <p className="text-sm text-muted-foreground">{tool.description}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
