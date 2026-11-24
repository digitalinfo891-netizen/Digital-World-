-- AddForeignKey
ALTER TABLE "RewardLedger" ADD CONSTRAINT "RewardLedger_conversionId_fkey" FOREIGN KEY ("conversionId") REFERENCES "RewardConversion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsdtLedger" ADD CONSTRAINT "UsdtLedger_withdrawalId_fkey" FOREIGN KEY ("withdrawalId") REFERENCES "UsdtWithdrawal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsdtLedger" ADD CONSTRAINT "UsdtLedger_conversionId_fkey" FOREIGN KEY ("conversionId") REFERENCES "RewardConversion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
