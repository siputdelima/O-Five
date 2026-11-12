/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from './components/Sidebar.js';
import { Header } from './components/Header.js';
import { DashboardView } from './components/DashboardView.js';
import { Stepper, StepId } from './components/Stepper.js';
import { NewContentFlow } from './components/NewContentFlow.js';
import { SourceTextModal } from './components/SourceTextModal.js';
import { AnalysisSummaryView } from './components/AnalysisSummaryView.js';
import { KipClassifierView } from './components/KipClassifierView.js';
import { ProductsResultView } from './components/ProductsResultView.js';
import { HistoryView } from './components/HistoryView.js';
import { GuideView } from './components/GuideView.js';
import { SettingsView } from './components/SettingsView.js';
import {
  AnalysisSummary,
  AppSettings,
  CommunicationProduct,
  ConsistencyComparisonRow,
  FullGenerationResult,
  KipItem,
  PolicyDocument,
  ProductType,
  VerificationFinding,
} from './types/index.js';
import {
  getAllDocuments,
  getAllGenerations,
  getAppSettings,
  saveAppSettings,
  saveDocument,
  saveGenerationResult,
  deleteDocument,
  clearAllData,
  getDocumentById,
  getGenerationResult,
} from './lib/indexedDb.js';

export default function App() {
  // Navigation & UI state
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sourceModalOpen, setSourceModalOpen] = useState(false);

  // Persistence state
  const [documents, setDocuments] = useState<PolicyDocument[]>([]);
  const [generations, setGenerations] = useState<FullGenerationResult[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    geminiModel: 'gemini-3.8-flash',
    verificationModel: 'gemini-3.8-flash',
    defaultTone: 'formal',
  });

  // Current Working Session state
  const [activeDocument, setActiveDocument] = useState<PolicyDocument | null>(null);
  const [activeSummary, setActiveSummary] = useState<AnalysisSummary | null>(null);
  const [activeKipItems, setActiveKipItems] = useState<KipItem[]>([]);
  const [activeProducts, setActiveProducts] = useState<Record<ProductType, CommunicationProduct> | null>(null);
  const [activeFindings, setActiveFindings] = useState<VerificationFinding[]>([]);
  const [activeConsistencyRows, setActiveConsistencyRows] = useState<ConsistencyComparisonRow[]>([]);

  // Stepper flow state
  const [currentStep, setCurrentStep] = useState<StepId>(1);
  const [maxReachedStep, setMaxReachedStep] = useState<StepId>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');

  // Initial load from IndexedDB
  useEffect(() => {
    async function loadData() {
      try {
        const [docs, gens, appSettings] = await Promise.all([
          getAllDocuments(),
          getAllGenerations(),
          getAppSettings(),
        ]);
        setDocuments(docs);
        setGenerations(gens);
        setSettings(appSettings);
      } catch (err) {
        console.error('Error loading initial data from IndexedDB:', err);
      }
    }
    loadData();
  }, []);

  const refreshHistory = async () => {
    const [docs, gens] = await Promise.all([getAllDocuments(), getAllGenerations()]);
    setDocuments(docs);
    setGenerations(gens);
  };

  // Step 1 -> 2: Upload / Extract -> Analyze
  const handleStartProcess = async (
    file: File | null,
    directText: string,
    supportingText: string,
    useOcr: boolean
  ) => {
    setIsLoading(true);
    setLoadingMessage('Mengekstrak naskah dokumen kebijakan...');

    try {
      let extractedData: any;

      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('useOcr', useOcr ? 'true' : 'false');
        formData.append('modelName', settings.geminiModel);

        const extractRes = await fetch('/api/extract', {
          method: 'POST',
          body: formData,
        });

        if (!extractRes.ok) {
          const errData = await extractRes.json();
          throw new Error(errData.error || 'Gagal mengekstrak teks dokumen.');
        }

        extractedData = await extractRes.json();
      } else {
        const extractRes = await fetch('/api/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ directText }),
        });

        if (!extractRes.ok) {
          const errData = await extractRes.json();
          throw new Error(errData.error || 'Gagal mengekstrak teks dokumen.');
        }

        extractedData = await extractRes.json();
      }

      // Create PolicyDocument record
      const docId = `doc-${Date.now()}`;
      const newDoc: PolicyDocument = {
        id: docId,
        fileName: extractedData.fileName || file?.name || 'Dokumen Kebijakan',
        fileSize: extractedData.fileSize || 0,
        fileType: extractedData.fileType || 'txt',
        extractedText: extractedData.text,
        supportingText: supportingText.trim() || undefined,
        pageCount: extractedData.pageCount,
        slideCount: extractedData.slideCount,
        wordCount: extractedData.wordCount,
        charCount: extractedData.charCount,
        isOcr: extractedData.isOcr || false,
        uploadedAt: new Date().toISOString(),
        status: 'uploaded',
      };

      setActiveDocument(newDoc);
      await saveDocument(newDoc);
      await refreshHistory();

      // Run Analysis with Gemini
      setLoadingMessage('Menganalisis substansi kebijakan dengan Gemini AI...');
      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: newDoc.extractedText,
          supportingText: newDoc.supportingText,
          modelName: settings.geminiModel,
        }),
      });

      if (!analyzeRes.ok) {
        const errData = await analyzeRes.json();
        throw new Error(errData.error || 'Gagal melakukan analisis dokumen.');
      }

      const summary: AnalysisSummary = await analyzeRes.json();
      setActiveSummary(summary);

      // Move to Step 2: Telaah Ringkasan
      setCurrentStep(2);
      setMaxReachedStep(2);
      setActiveTab('new');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  // Step 2 -> 3: Confirm Summary -> Classify KIP
  const handleConfirmSummary = async (confirmedSummary: AnalysisSummary) => {
    if (!activeDocument) return;
    setIsLoading(true);
    setLoadingMessage('Menelaah klasifikasi informasi publik (UU No. 14 Tahun 2008)...');

    try {
      const summaryWithTimestamp = {
        ...confirmedSummary,
        confirmedAt: new Date().toISOString(),
      };
      setActiveSummary(summaryWithTimestamp);

      const classifyRes = await fetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: summaryWithTimestamp,
          modelName: settings.geminiModel,
        }),
      });

      if (!classifyRes.ok) {
        const errData = await classifyRes.json();
        throw new Error(errData.error || 'Gagal melakukan klasifikasi KIP.');
      }

      const kipItems: KipItem[] = await classifyRes.json();
      setActiveKipItems(kipItems);

      // Move to Step 3: Penyaringan KIP
      setCurrentStep(3);
      if (maxReachedStep < 3) setMaxReachedStep(3);
    } catch (err: any) {
      alert(`Terjadi kesalahan: ${err.message}`);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  // Step 3 -> 4, 5, 6: Confirm KIP Decisions -> Generate 5 Products -> Verify -> Results
  const handleConfirmKipDecisions = async (updatedKipItems: KipItem[]) => {
    if (!activeDocument || !activeSummary) return;
    setIsLoading(true);
    setActiveKipItems(updatedKipItems);

    try {
      // Step 4: Generate 5 Products
      setCurrentStep(4);
      if (maxReachedStep < 4) setMaxReachedStep(4);
      setLoadingMessage('Menghasilkan 5 produk komunikasi strategis...');

      const genRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: activeSummary,
          kipItems: updatedKipItems,
          tone: settings.defaultTone,
          modelName: settings.geminiModel,
        }),
      });

      if (!genRes.ok) {
        const errData = await genRes.json();
        throw new Error(errData.error || 'Gagal menghasilkan 5 produk komunikasi.');
      }

      const products: Record<ProductType, CommunicationProduct> = await genRes.json();
      setActiveProducts(products);

      // Step 5: Verification (Two layers: deterministic + Gemini)
      setCurrentStep(5);
      if (maxReachedStep < 5) setMaxReachedStep(5);
      setLoadingMessage('Melakukan audit verifikasi berbasis teks sumber asli...');

      const verifyRes = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawSourceText: activeDocument.extractedText,
          products,
          modelName: settings.verificationModel,
        }),
      });

      let findings: VerificationFinding[] = [];
      let consistencyRows: ConsistencyComparisonRow[] = [];
      let updatedProducts = { ...products };

      if (verifyRes.ok) {
        const verifyData = await verifyRes.json();
        findings = verifyData.findings || [];
        consistencyRows = verifyData.consistencyRows || [];

        // Apply updated product verification statuses
        if (verifyData.productStatuses) {
          for (const [pType, status] of Object.entries(verifyData.productStatuses)) {
            if (updatedProducts[pType as ProductType]) {
              updatedProducts[pType as ProductType] = {
                ...updatedProducts[pType as ProductType],
                verificationStatus: status as any,
              };
            }
          }
        }
      }

      setActiveFindings(findings);
      setActiveConsistencyRows(consistencyRows);
      setActiveProducts(updatedProducts);

      // Save Full Generation Result to IndexedDB
      const fullResult: FullGenerationResult = {
        documentId: activeDocument.id,
        summary: activeSummary,
        kipItems: updatedKipItems,
        products: updatedProducts,
        verificationFindings: findings,
        consistencyRows,
        timestamp: new Date().toISOString(),
      };

      await saveGenerationResult(fullResult);
      await saveDocument({
        ...activeDocument,
        status: 'generated',
      });
      await refreshHistory();

      // Move to Step 6 / Results View
      setCurrentStep(6);
      setMaxReachedStep(7);
      setActiveTab('results');
    } catch (err: any) {
      alert(`Terjadi kesalahan: ${err.message}`);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  // Re-run verification on demand
  const handleRerunVerification = async () => {
    if (!activeDocument || !activeProducts) return;
    setIsLoading(true);
    setLoadingMessage('Mengaudit ulang kepatuhan sumber...');

    try {
      const verifyRes = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawSourceText: activeDocument.extractedText,
          products: activeProducts,
          modelName: settings.verificationModel,
        }),
      });

      if (!verifyRes.ok) {
        throw new Error('Gagal melakukan audit ulang.');
      }

      const verifyData = await verifyRes.json();
      setActiveFindings(verifyData.findings || []);
      setActiveConsistencyRows(verifyData.consistencyRows || []);

      if (verifyData.productStatuses) {
        const updated = { ...activeProducts };
        for (const [pType, status] of Object.entries(verifyData.productStatuses)) {
          if (updated[pType as ProductType]) {
            updated[pType as ProductType] = {
              ...updated[pType as ProductType],
              verificationStatus: status as any,
            };
          }
        }
        setActiveProducts(updated);

        // Update IndexedDB
        if (activeSummary) {
          await saveGenerationResult({
            documentId: activeDocument.id,
            summary: activeSummary,
            kipItems: activeKipItems,
            products: updated,
            verificationFindings: verifyData.findings || [],
            consistencyRows: verifyData.consistencyRows || [],
            timestamp: new Date().toISOString(),
          });
        }
      }
    } catch (err: any) {
      alert(`Audit gagal: ${err.message}`);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  // Update a single product (after manual edit or sign-off)
  const handleUpdateProduct = async (productType: ProductType, updatedProduct: CommunicationProduct) => {
    if (!activeProducts || !activeDocument || !activeSummary) return;

    const newProducts = {
      ...activeProducts,
      [productType]: updatedProduct,
    };
    setActiveProducts(newProducts);

    await saveGenerationResult({
      documentId: activeDocument.id,
      summary: activeSummary,
      kipItems: activeKipItems,
      products: newProducts,
      verificationFindings: activeFindings,
      consistencyRows: activeConsistencyRows,
      timestamp: new Date().toISOString(),
    });
    await refreshHistory();
  };

  // AI Refine a single product (regenerate, shorten, expand, restyle)
  const handleRegenerateProductAction = async (
    productType: ProductType,
    action: 'regenerate' | 'shorten' | 'expand' | 'style',
    style?: 'formal' | 'santai' | 'ringkas'
  ) => {
    if (!activeProducts || !activeSummary || !activeDocument) return;
    setIsLoading(true);
    setLoadingMessage(
      `Memproses ${action} untuk ${productType}...`
    );

    try {
      const current = activeProducts[productType];
      const res = await fetch('/api/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productType,
          currentContent: current.content,
          summary: activeSummary,
          action,
          targetStyle: style,
          modelName: settings.geminiModel,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Gagal memperbarui konten produk.');
      }

      const updated = await res.json();
      const newVersion = {
        version: current.versionHistory.length + 1,
        content: updated.content,
        modifiedAt: new Date().toISOString(),
        author: 'AI' as const,
        note: `AI ${action}${style ? ` (${style})` : ''}`,
      };

      const newProductObj: CommunicationProduct = {
        ...current,
        title: updated.title || current.title,
        content: updated.content,
        threadsPosts: updated.threadsPosts || current.threadsPosts,
        characterCount: updated.content.length,
        versionHistory: [...current.versionHistory, newVersion],
        verificationStatus: 'PERLU_PEMERIKSAAN', // Revision requires re-audit
      };

      await handleUpdateProduct(productType, newProductObj);
    } catch (err: any) {
      alert(`Gagal meregenerasi: ${err.message}`);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  // Open an existing document from History or Dashboard
  const handleOpenExistingDoc = async (doc: PolicyDocument) => {
    setActiveDocument(doc);
    const gen = await getGenerationResult(doc.id);
    if (gen) {
      setActiveSummary(gen.summary);
      setActiveKipItems(gen.kipItems);
      setActiveProducts(gen.products);
      setActiveFindings(gen.verificationFindings || []);
      setActiveConsistencyRows(gen.consistencyRows || []);
      setCurrentStep(6);
      setMaxReachedStep(7);
      setActiveTab('results');
    } else {
      setActiveTab('new');
    }
  };

  // Delete a document from History
  const handleDeleteDocument = async (id: string) => {
    await deleteDocument(id);
    if (activeDocument?.id === id) {
      setActiveDocument(null);
      setActiveSummary(null);
      setActiveProducts(null);
      setActiveFindings([]);
    }
    await refreshHistory();
  };

  // Settings handlers
  const handleSaveSettings = async (newSettings: AppSettings) => {
    await saveAppSettings(newSettings);
    setSettings(newSettings);
  };

  const handleClearAllData = async () => {
    await clearAllData();
    setActiveDocument(null);
    setActiveSummary(null);
    setActiveProducts(null);
    setActiveKipItems([]);
    setActiveFindings([]);
    setActiveConsistencyRows([]);
    setCurrentStep(1);
    setMaxReachedStep(1);
    await refreshHistory();
    setActiveTab('dashboard');
  };

  const getActiveTabTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Dashboard O-FIVE';
      case 'new':
        return 'Buat Konten Baru';
      case 'results':
        return 'Hasil Generasi 5 Produk';
      case 'history':
        return 'Riwayat Dokumen';
      case 'guide':
        return 'Panduan Penggunaan';
      case 'settings':
        return 'Pengaturan Sistem';
      default:
        return 'O-FIVE';
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f8fafc] text-slate-800">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (tab === 'results' && !activeProducts) {
            alert('Belum ada produk yang dihasilkan. Silakan buat konten baru terlebih dahulu.');
            return;
          }
          setActiveTab(tab);
        }}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        hasActiveResults={Boolean(activeProducts)}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Header */}
        <Header
          onOpenMobile={() => setMobileMenuOpen(true)}
          activeDoc={activeDocument}
          onOpenSourceModal={() => setSourceModalOpen(true)}
          activeTabTitle={getActiveTabTitle()}
        />

        {/* 7-Step Stepper (Shown when in 'new' or 'results' view) */}
        {(activeTab === 'new' || activeTab === 'results') && (
          <Stepper
            currentStep={currentStep}
            isLoading={isLoading}
            loadingMessage={loadingMessage}
            maxReachedStep={maxReachedStep}
            onStepClick={(step) => {
              setCurrentStep(step);
              if (step >= 6) {
                setActiveTab('results');
              } else {
                setActiveTab('new');
              }
            }}
          />
        )}

        {/* View Switcher */}
        <main className="flex-1 pb-16">
          {activeTab === 'dashboard' && (
            <DashboardView
              documents={documents}
              generations={generations}
              onStartNewContent={() => {
                setActiveTab('new');
                setCurrentStep(1);
              }}
              onOpenDocument={handleOpenExistingDoc}
            />
          )}

          {activeTab === 'new' && (
            <>
              {currentStep === 1 && (
                <NewContentFlow
                  onStartProcess={handleStartProcess}
                  isLoading={isLoading}
                />
              )}

              {currentStep === 2 && activeSummary && (
                <AnalysisSummaryView
                  initialSummary={activeSummary}
                  onConfirmSummary={handleConfirmSummary}
                  onOpenSourceModal={() => setSourceModalOpen(true)}
                  isLoading={isLoading}
                />
              )}

              {currentStep === 3 && (
                <KipClassifierView
                  initialKipItems={activeKipItems}
                  onConfirmKipDecisions={handleConfirmKipDecisions}
                  isLoading={isLoading}
                />
              )}

              {currentStep >= 4 && currentStep <= 5 && (
                <div className="p-12 text-center space-y-4">
                  <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 flex items-center justify-center text-[#0B1F3A]">
                    <div className="w-6 h-6 border-2 border-[#0B1F3A] border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <h3 className="text-base font-bold text-[#0B1F3A]">
                    {loadingMessage || 'Sedang memproses...'}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Menerapkan 10 Aturan AI O-FIVE, validasi anti-halusinasi, dan verifikasi teks sumber asli.
                  </p>
                </div>
              )}
            </>
          )}

          {activeTab === 'results' && activeDocument && activeSummary && activeProducts && (
            <ProductsResultView
              document={activeDocument}
              summary={activeSummary}
              kipItems={activeKipItems}
              products={activeProducts}
              findings={activeFindings}
              consistencyRows={activeConsistencyRows}
              onOpenSourceModal={() => setSourceModalOpen(true)}
              onUpdateProduct={handleUpdateProduct}
              onRegenerateProductAction={handleRegenerateProductAction}
              onRerunVerification={handleRerunVerification}
              isLoadingAction={isLoading}
            />
          )}

          {activeTab === 'history' && (
            <HistoryView
              documents={documents}
              generations={generations}
              onOpenDocument={handleOpenExistingDoc}
              onDeleteDocument={handleDeleteDocument}
              onStartNew={() => {
                setActiveTab('new');
                setCurrentStep(1);
              }}
            />
          )}

          {activeTab === 'guide' && <GuideView />}

          {activeTab === 'settings' && (
            <SettingsView
              settings={settings}
              onSaveSettings={handleSaveSettings}
              onClearAllData={handleClearAllData}
            />
          )}
        </main>
      </div>

      {/* Source Text Modal Drawer */}
      <SourceTextModal
        document={activeDocument}
        isOpen={sourceModalOpen}
        onClose={() => setSourceModalOpen(false)}
      />
    </div>
  );
}
