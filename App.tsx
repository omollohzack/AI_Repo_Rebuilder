
import React, { useState, useCallback, useRef } from 'react';
import { analyzeRepository, buildInitialComponent, modifyComponent } from './services/geminiService';
import { GitHubIcon, SparklesIcon, RocketLaunchIcon, WandIcon } from './components/icons';

// A simple component to render markdown-like content using regex and Tailwind classes.
// This avoids needing a full markdown library and is tailored to the expected AI output.
const SimpleMarkdownViewer: React.FC<{ content: string }> = ({ content }) => {
    const formattedContent = content
        .replace(/### (.*)/g, '<h3 class="text-2xl font-bold text-cyan-400 mt-6 mb-3">$1</h3>')
        .replace(/#### (.*)/g, '<h4 class="text-xl font-semibold text-gray-200 mt-4 mb-2">$1</h4>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-white">$1</strong>')
        .replace(/`([^`]+)`/g, '<code class="bg-gray-700 text-pink-400 rounded px-1.5 py-0.5 text-sm font-mono">$1</code>')
        .replace(/```([\s\S]*?)```/g, (match, p1) => `<pre class="bg-gray-800 p-4 rounded-lg overflow-x-auto my-4"><code class="font-mono text-sm text-gray-300">${p1.trim().replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>`)
        .replace(/^- (.*)/gm, '<li class="ml-6 mb-2 before:content-[\'-\'] before:absolute before:left-0 before:text-cyan-400">$1</li>')
        .replace(/^\d+\. (.*)/gm, (match, p1) => `<li class="ml-6 mb-2 relative pl-2">${p1}</li>`)
        .replace(/\n/g, '<br />')
        .replace(/<br \/>(<h3|<pre|<li)/g, '$1'); // Clean up extra breaks before block elements

    return (
        <div className="prose prose-invert max-w-none text-gray-300" dangerouslySetInnerHTML={{ __html: formattedContent }} />
    );
};

const App: React.FC = () => {
    const [repoUrl, setRepoUrl] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [analysisResult, setAnalysisResult] = useState<string>('');
    const [error, setError] = useState<string>('');

    // State for the new build feature
    const [showBuildUI, setShowBuildUI] = useState<boolean>(false);
    const [isBuilding, setIsBuilding] = useState<boolean>(false);
    const [liveHtml, setLiveHtml] = useState<string>('');
    const [buildError, setBuildError] = useState<string>('');
    const [modificationPrompt, setModificationPrompt] = useState<string>('');
    const [isModifying, setIsModifying] = useState<boolean>(false);

    const buildSectionRef = useRef<HTMLDivElement>(null);

    const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!repoUrl || isLoading) return;

        setIsLoading(true);
        setError('');
        setAnalysisResult('');
        setShowBuildUI(false);
        setLiveHtml('');
        setBuildError('');

        try {
            const result = await analyzeRepository(repoUrl);
            setAnalysisResult(result);
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, [repoUrl, isLoading]);

    const handleStartBuild = useCallback(async () => {
        if (!analysisResult || isBuilding) return;

        setShowBuildUI(true);
        setIsBuilding(true);
        setBuildError('');
        setLiveHtml(`
            <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif; color: #9ca3af; background-color: #111827;">
                <div style="text-align: center;">
                    <div style="width: 2rem; height: 2rem; border: 2px solid #fff; border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem;"></div>
                    <p>Building from plan...</p>
                </div>
            </div>
            <style>@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }</style>
        `);
        
        // Scroll to the build section smoothly
        setTimeout(() => buildSectionRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

        try {
            const result = await buildInitialComponent(analysisResult);
            setLiveHtml(result);
        } catch (err: any) {
            setBuildError(err.message || 'An unexpected error occurred during the build.');
        } finally {
            setIsBuilding(false);
        }
    }, [analysisResult, isBuilding]);

    const handleModifyBuild = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!modificationPrompt || isModifying) return;

        setIsModifying(true);
        setBuildError('');
        try {
            const result = await modifyComponent(analysisResult, liveHtml, modificationPrompt);
            setLiveHtml(result);
            setModificationPrompt('');
        } catch (err: any) {
            setBuildError(err.message || 'An unexpected error occurred during modification.');
        } finally {
            setIsModifying(false);
        }

    }, [analysisResult, liveHtml, modificationPrompt, isModifying]);

    return (
        <div className="min-h-screen bg-gray-900 font-sans text-gray-100 p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
                <header className="text-center mb-10">
                    <div className="inline-block p-4 bg-gray-800 rounded-full mb-4 border border-gray-700 shadow-lg">
                        <SparklesIcon className="w-10 h-10 text-cyan-400" />
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">
                        AI Repo Rebuilder
                    </h1>
                    <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-400">
                        Enter a GitHub URL, get a rebuild plan, and then bring it to life with our AI-powered live build tool.
                    </p>
                </header>

                <main>
                    <form onSubmit={handleSubmit} className="mb-12">
                        <div className="relative">
                            <GitHubIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-500" />
                            <input
                                type="url"
                                value={repoUrl}
                                onChange={(e) => setRepoUrl(e.target.value)}
                                placeholder="https://github.com/username/repository"
                                required
                                className="w-full pl-12 pr-40 py-4 text-lg bg-gray-800 border-2 border-gray-700 rounded-full focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:outline-none transition-all duration-300 text-gray-200 placeholder-gray-500"
                            />
                            <button
                                type="submit"
                                disabled={isLoading || !repoUrl}
                                className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:scale-100"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Analyzing...</span>
                                    </>
                                ) : (
                                    <>
                                        <SparklesIcon className="w-5 h-5" />
                                        <span>Analyze</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-8">
                        {error && (
                            <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg" role="alert">
                                <strong className="font-bold">Error: </strong>
                                <span className="block sm:inline">{error}</span>
                            </div>
                        )}

                        {analysisResult && !error && (
                            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 sm:p-8 shadow-2xl transition-opacity duration-500 animate-fade-in">
                                <h2 className="text-3xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-purple-400">
                                    Rebuilding Plan Generated
                                </h2>
                                <SimpleMarkdownViewer content={analysisResult} />
                                <div className="mt-8 pt-6 border-t border-gray-700 text-center">
                                     <button
                                        onClick={handleStartBuild}
                                        disabled={isBuilding}
                                        className="inline-flex items-center justify-center gap-3 bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white font-bold py-4 px-8 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:scale-100 shadow-lg"
                                    >
                                        <RocketLaunchIcon className="w-6 h-6" />
                                        <span>{isBuilding ? 'Building...' : 'Build this App'}</span>
                                    </button>
                                </div>
                            </div>
                        )}
                        
                        {showBuildUI && (
                            <div ref={buildSectionRef} className="mt-12 bg-gray-800/50 border border-gray-700 rounded-xl shadow-2xl transition-opacity duration-500 animate-fade-in">
                                <div className="p-4 sm:p-6 border-b border-gray-700">
                                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400">
                                        Live Build & Iteration
                                    </h2>
                                </div>
                                <div className="p-4 sm:p-6">
                                    <div className="aspect-video w-full bg-gray-900 rounded-lg border border-gray-600 shadow-inner">
                                        <iframe
                                            srcDoc={liveHtml}
                                            title="Live Preview"
                                            className="w-full h-full rounded-lg"
                                            sandbox="allow-scripts"
                                        />
                                    </div>

                                    <form onSubmit={handleModifyBuild} className="mt-6">
                                        <label htmlFor="modification-prompt" className="block text-lg font-medium text-gray-300 mb-2">Modify the component</label>
                                        <div className="relative">
                                            <WandIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                            <input
                                                id="modification-prompt"
                                                type="text"
                                                value={modificationPrompt}
                                                onChange={(e) => setModificationPrompt(e.target.value)}
                                                placeholder="e.g., 'Change the primary button color to green'"
                                                required
                                                className="w-full pl-10 pr-32 py-3 bg-gray-800 border border-gray-600 rounded-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition text-gray-200 placeholder-gray-500"
                                            />
                                            <button
                                                type="submit"
                                                disabled={isModifying || !modificationPrompt}
                                                className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-5 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                                            >
                                                {isModifying && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                                                <span>Modify</span>
                                            </button>
                                        </div>
                                    </form>
                                    {buildError && (
                                        <div className="mt-4 bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm" role="alert">
                                            <strong className="font-bold">Error: </strong>
                                            <span>{buildError}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {!isLoading && !analysisResult && !error && (
                             <div className="text-center text-gray-500 p-8 border-2 border-dashed border-gray-700 rounded-lg">
                                <h3 className="text-xl font-semibold mb-2">Ready to Start?</h3>
                                <p>Your AI-generated rebuilding plan will appear here once you submit a repository URL.</p>
                            </div>
                        )}
                    </div>
                </main>

                <footer className="text-center mt-16 text-gray-600 text-sm">
                    <p>Powered by Google Gemini. This is a conceptual tool and does not access repository code.</p>
                </footer>
            </div>
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.5s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default App;
