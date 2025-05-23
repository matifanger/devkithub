import { Search, X } from 'lucide-react';
import * as React from 'react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/icons/icon.png';
import { Badge } from '../components/ui/badge';
import { Card } from '../components/ui/card';
import { allTools } from '../utils/tools-data';

export function MainPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Define categories based on tool analysis
  const categories = [
    'Data Conversion',
    'Text & String',
    'Security & Crypto',
    'Code Formatting',
    'Development',
    'Preview',
  ];

  // Function to categorize tools based on their title and description
  const categorizeTool = (tool: (typeof allTools)[number]) => {
    const title = tool.title.toLowerCase();
    const desc = tool.description.toLowerCase();

    if (
      title.includes('json') ||
      title.includes('yaml') ||
      title.includes('csv') ||
      title.includes('to') ||
      desc.includes('convert')
    ) {
      return 'Data Conversion';
    } else if (
      title.includes('string') ||
      title.includes('text') ||
      title.includes('base64') ||
      title.includes('html entity') ||
      title.includes('escape') ||
      title.includes('lorem')
    ) {
      return 'Text & String';
    } else if (
      title.includes('hash') ||
      title.includes('jwt') ||
      title.includes('certificate') ||
      title.includes('key')
    ) {
      return 'Security & Crypto';
    } else if (
      title.includes('beautify') ||
      title.includes('minify') ||
      title.includes('formatter')
    ) {
      return 'Code Formatting';
    } else if (
      title.includes('url') ||
      title.includes('regex') ||
      title.includes('converter') ||
      title.includes('hex') ||
      title.includes('ascii') ||
      title.includes('color') ||
      title.includes('time') ||
      title.includes('qr') ||
      title.includes('php') ||
      title.includes('cron') ||
      title.includes('sort') ||
      title.includes('generator')
    ) {
      return 'Development';
    } else if (title.includes('preview')) {
      return 'Preview';
    }
    return 'Development'; // Default category
  };

  // Function to toggle category selection
  const toggleCategory = (category: string) => {
    setSelectedCategory(selectedCategory === category ? '' : category);
  };

  // Filter tools based on search query and selected category
  const filteredTools = useMemo(() => {
    let result = [...allTools];

    // Apply category filter
    if (selectedCategory) {
      result = result.filter((tool) => categorizeTool(tool) === selectedCategory);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (tool) =>
          tool.title.toLowerCase().includes(query) || tool.description.toLowerCase().includes(query)
      );
    }

    return result;
  }, [searchQuery, selectedCategory]);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col items-center mb-10">
        <img src={logo} alt="DevKitHub" className="w-16 h-16 mb-4" />
        <h1 className="text-4xl font-bold text-center mb-4">DevKitHub</h1>
        <p className="text-xl text-muted-foreground max-w-3xl text-center mb-8">
          Your one-stop solution for developer tools. Browse our collection of utilities to help you
          with common programming tasks.
        </p>

        {/* Search Bar */}
        <div className="relative w-full max-w-2xl mb-8">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            type="text"
            placeholder={`Search across ${allTools.length} tools...`}
            className="block w-full pl-10 pr-3 py-3 border border-input rounded-md leading-5 bg-background placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring sm:text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>

        {/* Category Filters */}
        <div className="w-full max-w-4xl mb-8 flex flex-wrap gap-2 justify-center">
          {categories.map((category) => (
            <Badge
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              className="cursor-pointer px-4 py-2 text-sm hover:bg-primary/80 transition-colors"
              onClick={() => toggleCategory(category)}
            >
              {category}
            </Badge>
          ))}
          {selectedCategory && (
            <Badge
              variant="outline"
              className="cursor-pointer px-4 py-2 text-sm hover:bg-muted/80 transition-colors border-none"
              onClick={() => setSelectedCategory('')}
            >
              Clear filter
            </Badge>
          )}
        </div>
      </div>

      {/* Tools Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredTools.map((tool) => (
          <Link
            key={tool.title}
            to={tool.url}
            className="block transform transition-all duration-200 hover:-translate-y-1"
          >
            <Card className="h-full hover:shadow-lg border-border/50 hover:border-border">
              <div className="p-6 space-y-4">
                <div
                  className={`w-12 h-12 rounded-lg ${tool.color} flex items-center justify-center`}
                >
                  <tool.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{tool.title}</h3>
                  <p className="text-sm text-muted-foreground">{tool.description}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* No Results */}
      {filteredTools.length === 0 && (
        <div className="text-center py-10">
          <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground">No tools found</h3>
          <p className="mt-1 text-muted-foreground">Try adjusting your search or filter</p>
        </div>
      )}
    </div>
  );
}
