export interface PerformanceBudget {
    // Core Web Vitals thresholds
    fcp: { good: number; needsImprovement: number };
    lcp: { good: number; needsImprovement: number };
    fid: { good: number; needsImprovement: number };
    cls: { good: number; needsImprovement: number };
    ttfb: { good: number; needsImprovement: number };
    tti: { good: number; needsImprovement: number };

    // Bundle size thresholds (in bytes)
    bundleSize: {
        total: { good: number; needsImprovement: number };
        js: { good: number; needsImprovement: number };
        css: { good: number; needsImprovement: number };
        images: { good: number; needsImprovement: number };
        fonts: { good: number; needsImprovement: number };
    };

    // React performance thresholds
    react: {
        maxRenderTime: number; // Maximum render time in ms
        maxCommitTime: number; // Maximum commit time in ms
        maxRerenders: number; // Maximum re-renders per component
    };
}

// Default performance budget based on industry standards
export const DEFAULT_PERFORMANCE_BUDGET: PerformanceBudget = {
    fcp: { good: 1800, needsImprovement: 3000 },
    lcp: { good: 2500, needsImprovement: 4000 },
    fid: { good: 100, needsImprovement: 300 },
    cls: { good: 0.1, needsImprovement: 0.25 },
    ttfb: { good: 800, needsImprovement: 1800 },
    tti: { good: 3800, needsImprovement: 7300 },

    bundleSize: {
        total: { good: 2 * 1024 * 1024, needsImprovement: 4 * 1024 * 1024 }, // 2MB / 4MB
        js: { good: 1.5 * 1024 * 1024, needsImprovement: 3 * 1024 * 1024 }, // 1.5MB / 3MB
        css: { good: 100 * 1024, needsImprovement: 200 * 1024 }, // 100KB / 200KB
        images: { good: 500 * 1024, needsImprovement: 1 * 1024 * 1024 }, // 500KB / 1MB
        fonts: { good: 100 * 1024, needsImprovement: 200 * 1024 }, // 100KB / 200KB
    },

    react: {
        maxRenderTime: 16, // 60fps = 16ms per frame
        maxCommitTime: 50, // Maximum commit time
        maxRerenders: 10, // Maximum re-renders per component
    }
};

export interface PerformanceViolation {
    metric: string;
    value: number;
    threshold: number;
    severity: 'good' | 'needsImprovement' | 'poor';
    message: string;
}

export const checkPerformanceBudget = (
    metrics: {
        fcp?: number | null;
        lcp?: number | null;
        fid?: number | null;
        cls?: number | null;
        ttfb?: number | null;
        tti?: number | null;
    },
    bundleMetrics?: {
        totalSize?: number;
        jsSize?: number;
        cssSize?: number;
        imageSize?: number;
        fontSize?: number;
    },
    budget: PerformanceBudget = DEFAULT_PERFORMANCE_BUDGET
): PerformanceViolation[] => {
    const violations: PerformanceViolation[] = [];

    // Check Core Web Vitals
    if (metrics.fcp !== null && metrics.fcp !== undefined) {
        const threshold = metrics.fcp <= budget.fcp.good ? budget.fcp.good : budget.fcp.needsImprovement;
        const severity = metrics.fcp <= budget.fcp.good ? 'good' :
            metrics.fcp <= budget.fcp.needsImprovement ? 'needsImprovement' : 'poor';

        if (severity !== 'good') {
            violations.push({
                metric: 'FCP',
                value: metrics.fcp,
                threshold,
                severity,
                message: `First Contentful Paint (${metrics.fcp.toFixed(2)}ms) exceeds ${threshold}ms threshold`,
            });
        }
    }

    if (metrics.lcp !== null && metrics.lcp !== undefined) {
        const threshold = metrics.lcp <= budget.lcp.good ? budget.lcp.good : budget.lcp.needsImprovement;
        const severity = metrics.lcp <= budget.lcp.good ? 'good' :
            metrics.lcp <= budget.lcp.needsImprovement ? 'needsImprovement' : 'poor';

        if (severity !== 'good') {
            violations.push({
                metric: 'LCP',
                value: metrics.lcp,
                threshold,
                severity,
                message: `Largest Contentful Paint (${metrics.lcp.toFixed(2)}ms) exceeds ${threshold}ms threshold`,
            });
        }
    }

    if (metrics.fid !== null && metrics.fid !== undefined) {
        const threshold = metrics.fid <= budget.fid.good ? budget.fid.good : budget.fid.needsImprovement;
        const severity = metrics.fid <= budget.fid.good ? 'good' :
            metrics.fid <= budget.fid.needsImprovement ? 'needsImprovement' : 'poor';

        if (severity !== 'good') {
            violations.push({
                metric: 'FID',
                value: metrics.fid,
                threshold,
                severity,
                message: `First Input Delay (${metrics.fid.toFixed(2)}ms) exceeds ${threshold}ms threshold`,
            });
        }
    }

    if (metrics.cls !== null && metrics.cls !== undefined) {
        const threshold = metrics.cls <= budget.cls.good ? budget.cls.good : budget.cls.needsImprovement;
        const severity = metrics.cls <= budget.cls.good ? 'good' :
            metrics.cls <= budget.cls.needsImprovement ? 'needsImprovement' : 'poor';

        if (severity !== 'good') {
            violations.push({
                metric: 'CLS',
                value: metrics.cls,
                threshold,
                severity,
                message: `Cumulative Layout Shift (${metrics.cls.toFixed(3)}) exceeds ${threshold} threshold`,
            });
        }
    }

    if (metrics.ttfb !== null && metrics.ttfb !== undefined) {
        const threshold = metrics.ttfb <= budget.ttfb.good ? budget.ttfb.good : budget.ttfb.needsImprovement;
        const severity = metrics.ttfb <= budget.ttfb.good ? 'good' :
            metrics.ttfb <= budget.ttfb.needsImprovement ? 'needsImprovement' : 'poor';

        if (severity !== 'good') {
            violations.push({
                metric: 'TTFB',
                value: metrics.ttfb,
                threshold,
                severity,
                message: `Time to First Byte (${metrics.ttfb.toFixed(2)}ms) exceeds ${threshold}ms threshold`,
            });
        }
    }

    if (metrics.tti !== null && metrics.tti !== undefined) {
        const threshold = metrics.tti <= budget.tti.good ? budget.tti.good : budget.tti.needsImprovement;
        const severity = metrics.tti <= budget.tti.good ? 'good' :
            metrics.tti <= budget.tti.needsImprovement ? 'needsImprovement' : 'poor';

        if (severity !== 'good') {
            violations.push({
                metric: 'TTI',
                value: metrics.tti,
                threshold,
                severity,
                message: `Time to Interactive (${metrics.tti.toFixed(2)}ms) exceeds ${threshold}ms threshold`,
            });
        }
    }

    // Check Bundle Size
    if (bundleMetrics) {
        if (bundleMetrics.totalSize !== undefined) {
            const threshold = bundleMetrics.totalSize <= budget.bundleSize.total.good ?
                budget.bundleSize.total.good : budget.bundleSize.total.needsImprovement;
            const severity = bundleMetrics.totalSize <= budget.bundleSize.total.good ? 'good' :
                bundleMetrics.totalSize <= budget.bundleSize.total.needsImprovement ? 'needsImprovement' : 'poor';

            if (severity !== 'good') {
                violations.push({
                    metric: 'Bundle Size',
                    value: bundleMetrics.totalSize,
                    threshold,
                    severity,
                    message: `Total bundle size (${formatBytes(bundleMetrics.totalSize)}) exceeds ${formatBytes(threshold)} threshold`,
                });
            }
        }

        if (bundleMetrics.jsSize !== undefined) {
            const threshold = bundleMetrics.jsSize <= budget.bundleSize.js.good ?
                budget.bundleSize.js.good : budget.bundleSize.js.needsImprovement;
            const severity = bundleMetrics.jsSize <= budget.bundleSize.js.good ? 'good' :
                bundleMetrics.jsSize <= budget.bundleSize.js.needsImprovement ? 'needsImprovement' : 'poor';

            if (severity !== 'good') {
                violations.push({
                    metric: 'JS Bundle',
                    value: bundleMetrics.jsSize,
                    threshold,
                    severity,
                    message: `JavaScript bundle size (${formatBytes(bundleMetrics.jsSize)}) exceeds ${formatBytes(threshold)} threshold`,
                });
            }
        }
    }

    return violations;
};

const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export const getPerformanceScore = (violations: PerformanceViolation[]): number => {
    if (violations.length === 0) return 100;

    const poorViolations = violations.filter(v => v.severity === 'poor').length;
    const needsImprovementViolations = violations.filter(v => v.severity === 'needsImprovement').length;

    // Calculate score: 100 - (poor * 20) - (needsImprovement * 10)
    const score = Math.max(0, 100 - (poorViolations * 20) - (needsImprovementViolations * 10));

    return score;
}; 