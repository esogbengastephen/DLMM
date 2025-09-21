import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

interface PortfolioSnapshotProps {
  totalLiquidity: string;
  feesEarned: string;
  positionsCount: number;
}

export const PortfolioSnapshot: React.FC<PortfolioSnapshotProps> = ({
  totalLiquidity,
  feesEarned,
  positionsCount,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Snapshot</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-1">
              {totalLiquidity}
            </div>
            <div className="text-sm text-gray-400">Total Liquidity</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#00d4aa] mb-1">
              {feesEarned}
            </div>
            <div className="text-sm text-gray-400">Fees Earned</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-1">
              {positionsCount}
            </div>
            <div className="text-sm text-gray-400">Active Positions</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};