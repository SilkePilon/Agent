"use client";

import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import {
  Bot,
  Search,
  Filter,
  SortAsc,
  ChevronDown,
  X,
  DollarSign,
  Clock,
  Zap,
  Brain,
  Star,
  Eye,
  Shield,
  ChevronRight,
  Check,
  ArrowUpRight,
  Cpu,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gemini,
  OpenRouter,
  OpenAI,
  Anthropic,
  Mistral,
  Meta,
  Cohere,
  Gemma,
  Perplexity,
  Qwen,
  Grok,
} from "@lobehub/icons";

import { cn } from "@/lib/utils";
import { getAllModels, type ModelOption } from "@/lib/models";
import { useIsMobile } from "@/hooks/use-mobile";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Provider icons mapping
const getProviderIcon = (providerId: string) => {
  const provider = providerId.toLowerCase();

  if (provider.includes("openai") || providerId.includes("gpt")) return OpenAI;
  if (provider.includes("anthropic") || providerId.includes("claude"))
    return Anthropic;
  if (provider.includes("google") || providerId.includes("gemini"))
    return Gemini;
  if (provider.includes("mistral")) return Mistral;
  if (provider.includes("meta") || providerId.includes("llama")) return Meta;
  if (provider.includes("cohere")) return Cohere;
  if (provider.includes("perplexity")) return Perplexity;
  if (provider.includes("qwen")) return Qwen;
  if (provider.includes("grok")) return Grok;
  if (provider.includes("gemma")) return Gemma;

  return OpenRouter; // Default icon
};

// Sorting options
type SortOption = "name" | "price-low" | "price-high" | "context" | "popular";

interface ModelSelectorProps {
  selectedModel?: string;
  onModelSelect: (modelId: string) => void;
  provider?: string;
  children?: React.ReactNode;
  onOpenChange?: (open: boolean) => void; // Add callback to notify parent of open state
}

interface ModelGridProps {
  models: ModelOption[];
  selectedModel?: string;
  onModelSelect: (modelId: string) => void;
  searchQuery: string;
  sortBy: SortOption;
  filterProvider: string;
}

interface ModelCardProps {
  model: ModelOption;
  isSelected: boolean;
  onClick: () => void;
}

function ModelCard({ model, isSelected, onClick }: ModelCardProps) {
  const ProviderIcon = getProviderIcon(model.id); // Dynamically fetch the correct icon based on the model ID or provider

  const formatPrice = (price?: number) => {
    if (price === undefined) return "N/A";
    if (price === 0) return "Free";
    const pricePerMillion = price * 1000000;
    if (pricePerMillion < 1) return `$${pricePerMillion.toFixed(2)}/M`;
    return `$${pricePerMillion.toFixed(1)}/M`;
  };

  const getPriceColor = (price?: number) => {
    if (!price || price === 0) return "text-green-600";
    const pricePerMillion = price * 1000000;
    if (pricePerMillion < 1) return "text-green-600";
    if (pricePerMillion < 10) return "text-yellow-600";
    return "text-red-600";
  };

  const formatContextLength = (length?: number) => {
    if (!length) return "";
    if (length >= 1000000) return `${(length / 1000000).toFixed(1)}M`;
    if (length >= 1000) return `${(length / 1000).toFixed(0)}K`;
    return length.toString();
  };

  const hasVision = model.architecture?.inputModalities?.includes("image");
  const isModerated = model.topProvider?.isModerated;

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <Card
            className={cn(
              "relative cursor-pointer transition-all duration-300 hover:shadow-md group",
              "border-2 rounded-xl p-0 overflow-hidden",
              isSelected
                ? "border-primary shadow-md bg-primary/5"
                : "border-border hover:border-primary/50"
            )}
            onClick={onClick}
          >
            <CardContent className="p-4 space-y-3 h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 flex items-center justify-center">
                    <ProviderIcon className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1">
                    {hasVision && (
                      <Badge
                        variant="outline"
                        className="text-xs px-1.5 py-0.5 h-auto"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Vision
                      </Badge>
                    )}
                    {isModerated && (
                      <Badge
                        variant="outline"
                        className="text-xs px-1.5 py-0.5 h-auto"
                      >
                        <Shield className="w-3 h-3 mr-1" />
                        Safe
                      </Badge>
                    )}
                  </div>
                </div>
                {isSelected && (
                  <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-primary-foreground" />
                  </div>
                )}
              </div>

              {/* Model Name */}
              <div className="space-y-1 min-w-0">
                <h3 className="font-medium text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                  {model.name}
                </h3>
                {model.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {model.description}
                  </p>
                )}
              </div>

              {/* Pricing & Context */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-muted-foreground" />
                  <span
                    className={cn(
                      "font-medium",
                      getPriceColor(model.pricing?.prompt)
                    )}
                  >
                    {formatPrice(model.pricing?.prompt)}
                  </span>
                </div>
                {model.contextLength && (
                  <div className="flex items-center gap-1">
                    <Brain className="w-3 h-3 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {formatContextLength(model.contextLength)}
                    </span>
                  </div>
                )}
              </div>

              {/* Parameters */}
              {model.supportedParameters &&
                model.supportedParameters.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {model.supportedParameters.slice(0, 2).map((param) => (
                      <Badge
                        key={param}
                        variant="secondary"
                        className="text-xs px-1.5 py-0.5 h-auto"
                      >
                        {param}
                      </Badge>
                    ))}
                    {model.supportedParameters.length > 2 && (
                      <Badge
                        variant="outline"
                        className="text-xs px-1.5 py-0.5 h-auto text-muted-foreground"
                      >
                        +{model.supportedParameters.length - 2}
                      </Badge>
                    )}
                  </div>
                )}

              {/* Modalities */}
              <div className="flex flex-wrap gap-1">
                {model.architecture?.inputModalities?.map((modality) => (
                  <Badge
                    key={`input-${modality}`}
                    variant="outline"
                    className="text-xs px-1.5 py-0.5 h-auto"
                  >
                    <ArrowUpRight className="w-2.5 h-2.5 mr-1" />
                    {modality}
                  </Badge>
                ))}
                {model.architecture?.outputModalities?.map((modality) => (
                  <Badge
                    key={`output-${modality}`}
                    variant="outline"
                    className="text-xs px-1.5 py-0.5 h-auto"
                  >
                    <ChevronRight className="w-2.5 h-2.5 mr-1" />
                    {modality}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="bg-popover text-popover-foreground max-w-xs rounded-md shadow-md p-3 border border-border"
        >
          <div className="space-y-2">
            <div className="font-medium">{model.name}</div>
            {model.description && (
              <p className="text-sm text-muted-foreground">
                {model.description}
              </p>
            )}
            <div className="flex items-center gap-4 text-xs">
              {model.pricing && (
                <div className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  <span>Input: {formatPrice(model.pricing.prompt)}</span>
                  <span>Output: {formatPrice(model.pricing.completion)}</span>
                </div>
              )}
              {model.contextLength && (
                <div className="flex items-center gap-1">
                  <Brain className="w-3 h-3" />
                  <span>{formatContextLength(model.contextLength)} tokens</span>
                </div>
              )}
            </div>
            {model.supportedParameters &&
              model.supportedParameters.length > 0 && (
                <div className="text-xs">
                  <span className="font-medium">Parameters: </span>
                  <span className="text-muted-foreground">
                    {model.supportedParameters.join(", ")}
                  </span>
                </div>
              )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function ModelGrid({
  models,
  selectedModel,
  onModelSelect,
  searchQuery,
  sortBy,
  filterProvider,
}: ModelGridProps) {
  const filteredAndSortedModels = useMemo(() => {
    let filtered = models;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (model) =>
          model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          model.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          model.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by provider
    if (filterProvider && filterProvider !== "all") {
      filtered = filtered.filter((model) => {
        const provider = model.id.toLowerCase();
        return provider.includes(filterProvider.toLowerCase());
      });
    }

    // Sort models
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "price-low":
          const priceA = a.pricing?.prompt || 0;
          const priceB = b.pricing?.prompt || 0;
          return priceA - priceB;
        case "price-high":
          const priceA2 = a.pricing?.prompt || 0;
          const priceB2 = b.pricing?.prompt || 0;
          return priceB2 - priceA2;
        case "context":
          return (b.contextLength || 0) - (a.contextLength || 0);
        case "popular":
          // Sort popular models first (based on common providers/models)
          const popularModels = ["gpt-4", "claude-3", "gemini", "llama"];
          const aPopular = popularModels.some((p) =>
            a.id.toLowerCase().includes(p)
          );
          const bPopular = popularModels.some((p) =>
            b.id.toLowerCase().includes(p)
          );
          if (aPopular && !bPopular) return -1;
          if (!aPopular && bPopular) return 1;
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [models, searchQuery, sortBy, filterProvider]);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-5 gap-4 p-1">
      {filteredAndSortedModels.map((model) => (
        <ModelCard
          key={model.id}
          model={model}
          isSelected={selectedModel === model.id}
          onClick={() => onModelSelect(model.id)}
        />
      ))}
    </div>
  );
}

function ModelSelectorContent({
  models,
  selectedModel,
  onModelSelect,
  onClose,
}: {
  models: ModelOption[];
  selectedModel?: string;
  onModelSelect: (modelId: string) => void;
  onClose: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("popular");
  const [filterProvider, setFilterProvider] = useState("all");

  // Get unique providers
  const providers = useMemo(() => {
    const providerSet = new Set<string>();
    models.forEach((model) => {
      const provider = model.id.toLowerCase();
      if (provider.includes("openai") || provider.includes("gpt"))
        providerSet.add("openai");
      else if (provider.includes("anthropic") || provider.includes("claude"))
        providerSet.add("anthropic");
      else if (provider.includes("google") || provider.includes("gemini"))
        providerSet.add("google");
      else if (provider.includes("mistral")) providerSet.add("mistral");
      else if (provider.includes("meta") || provider.includes("llama"))
        providerSet.add("meta");
      else if (provider.includes("cohere")) providerSet.add("cohere");
      else if (provider.includes("perplexity")) providerSet.add("perplexity");
      else providerSet.add("other");
    });
    return Array.from(providerSet).sort();
  }, [models]);

  const handleModelSelect = (modelId: string) => {
    onModelSelect(modelId);
    onClose();
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search models..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Sort and Filter */}
        <div className="flex gap-2">
          <Select
            value={sortBy}
            onValueChange={(value: SortOption) => setSortBy(value)}
          >
            <SelectTrigger className="w-36">
              <SortAsc className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popular">Popular</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="price-low">Price (Low)</SelectItem>
              <SelectItem value="price-high">Price (High)</SelectItem>
              <SelectItem value="context">Context Size</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterProvider} onValueChange={setFilterProvider}>
            <SelectTrigger className="w-32">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Providers</SelectItem>
              {providers.map((provider) => (
                <SelectItem key={provider} value={provider}>
                  {provider.charAt(0).toUpperCase() + provider.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>{" "}
      {/* Model Grid */}
      <div className="max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 pr-2">
        <ModelGrid
          models={models}
          selectedModel={selectedModel}
          onModelSelect={handleModelSelect}
          searchQuery={searchQuery}
          sortBy={sortBy}
          filterProvider={filterProvider}
        />
      </div>
    </div>
  );
}

export function ModelSelector({
  selectedModel,
  onModelSelect,
  provider,
  children,
  onOpenChange,
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [models, setModels] = useState<ModelOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const isMobile = useIsMobile();

  // Handle open state changes and notify parent
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    onOpenChange?.(open); // Notify parent component
  };

  // Load models when opened
  useEffect(() => {
    if (isOpen && models.length === 0) {
      setIsLoading(true);
      getAllModels()
        .then((allModels) => {
          setModels(allModels);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error("Failed to load models:", error);
          setIsLoading(false);
        });
    }
  }, [isOpen, models.length]);

  // Get current model name for display
  const selectedModelName = useMemo(() => {
    if (!selectedModel) return "Select Model";
    const model = models.find((m) => m.id === selectedModel);
    return (
      model?.name ||
      selectedModel.split("/").pop()?.split(":")[0] ||
      "Unknown Model"
    );
  }, [selectedModel, models]);

  const triggerButton = children || (
    <Button
      variant="outline"
      className="justify-between text-foreground truncate overflow-hidden text-ellipsis border-2 w-full max-w-full"
    >
      <span className="truncate flex-1 text-left">{selectedModelName}</span>
      <ChevronDown className="h-4 w-4 ml-2 flex-shrink-0" />
    </Button>
  );
  const content = (
    <ModelSelectorContent
      models={models}
      selectedModel={selectedModel}
      onModelSelect={onModelSelect}
      onClose={() => handleOpenChange(false)}
    />
  );
  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={handleOpenChange}>
        <DrawerTrigger asChild>{triggerButton}</DrawerTrigger>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>Select Model</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-2">Loading models...</span>
              </div>
            ) : (
              content
            )}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{triggerButton}</DialogTrigger>{" "}
      <DialogContent
        className="overflow-hidden"
        style={{ width: "80vw", maxWidth: "1500px", maxHeight: "95vh" }}
      >
        <DialogHeader>
          <DialogTitle>Select Model</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading models...</span>
          </div>
        ) : (
          content
        )}
      </DialogContent>
    </Dialog>
  );
}
