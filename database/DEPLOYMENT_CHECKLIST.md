# Database Deployment Checklist

**Project**: Taiwan Celebrity Tracker
**Database Version**: 2.0 (Production-Hardened)
**Date**: November 11, 2025

---

## PRE-DEPLOYMENT PHASE

### [ ] 1. Review & Understand Changes
- [ ] Read IMPROVEMENTS.md completely
- [ ] Review schema.sql comments
- [ ] Understand all 9 improvements
- [ ] Review migration script (v1_to_v2.sql)
- [ ] Document any concerns

### [ ] 2. Prepare Environment
- [ ] Verify MySQL 8.0+ is installed
- [ ] Confirm database user 'celeb_user' exists
- [ ] Ensure proper file permissions on scripts
- [ ] Test shell script execution (bash --version)
- [ ] Verify all scripts are executable: `ls -la scripts/*.sh`

### [ ] 3. Backup Current State
- [ ] Create full backup of production database (if exists)
- [ ] Verify backup file integrity: `gunzip -t backup_*.sql.gz`
- [ ] Store backup in secure location
- [ ] Document backup location and timestamp
- [ ] Test restore on test environment

### [ ] 4. Staging Deployment
- [ ] Deploy to staging database first
- [ ] Run migration script: `mysql -u celeb_user -p taiwan_celebrities < migrations/v1_to_v2.sql`
- [ ] Verify all tables created without errors
- [ ] Run verification queries:
  ```sql
  SELECT COUNT(*) FROM celebrities;
  SELECT COUNT(*) FROM celebrity_mentions;
  SELECT COUNT(*) FROM metrics_cache;
  SELECT COUNT(*) FROM scraping_jobs;
  ```
- [ ] Check table structures: `DESCRIBE celebrities;` (for each table)
- [ ] Verify indexes exist: `SHOW INDEXES FROM celebrity_mentions;`
- [ ] Test constraints with invalid data (should fail)
- [ ] Confirm all rows match pre-migration count

### [ ] 5. Data Integrity Verification
- [ ] Run backup-restore-test.sh on staging:
  ```bash
  bash scripts/backup-restore-test.sh
  ```
- [ ] Verify test completes with "BACKUP VERIFICATION PASSED"
- [ ] Check all row counts match original
- [ ] Verify table structures are intact
- [ ] Confirm all constraints are enforced

### [ ] 6. Application Testing
- [ ] Deploy updated application (if needed)
- [ ] Run all application tests
- [ ] Test celebrity lookup queries
- [ ] Test metrics calculations
- [ ] Test mention storage
- [ ] Test scraping job tracking
- [ ] Monitor error logs for issues
- [ ] Verify API endpoints work
- [ ] Load test with sample data

### [ ] 7. Performance Verification
- [ ] Enable slow query log on staging
- [ ] Run representative queries
- [ ] Verify query execution time < 2 seconds
- [ ] Check index usage: `EXPLAIN SELECT ...`
- [ ] Verify full-text search works
- [ ] Test composite index queries
- [ ] Profile query performance
- [ ] Document baseline metrics

### [ ] 8. Script Validation
- [ ] Test backup-db.sh execution
- [ ] Test restore-db.sh execution
- [ ] Test optimize-tables.sh execution
- [ ] Test check-table-growth.sh execution
- [ ] Test check-slow-queries.sh execution
- [ ] Verify all scripts handle errors correctly
- [ ] Test with VERIFY_BACKUP=true flag
- [ ] Check cron-friendly output formats

---

## PRODUCTION DEPLOYMENT PHASE

### [ ] 9. Pre-Deployment Notification
- [ ] Notify development team of planned changes
- [ ] Schedule deployment window (off-peak hours recommended)
- [ ] Plan 30-minute maintenance window
- [ ] Prepare rollback plan
- [ ] Have DBA on standby
- [ ] Document deployment start time

### [ ] 10. Production Backup
- [ ] Run full backup of production:
  ```bash
  bash scripts/backup-db.sh
  ```
- [ ] Verify backup file exists and has size > 1MB
- [ ] Test backup with: `gunzip -t backup_*.sql.gz`
- [ ] Copy backup to secondary storage
- [ ] Document backup filename and timestamp
- [ ] Verify can restore if needed

### [ ] 11. Production Migration
- [ ] Stop application (optional, migration can run live)
- [ ] Run migration script:
  ```bash
  mysql -u celeb_user -p taiwan_celebrities < migrations/v1_to_v2.sql
  ```
- [ ] Monitor for errors (should be none)
- [ ] Check migration completed without warnings
- [ ] Document completion time
- [ ] Verify no partial migrations

### [ ] 12. Post-Migration Verification
- [ ] Verify row counts for each table:
  ```sql
  SELECT 'celebrities', COUNT(*) FROM celebrities
  UNION ALL
  SELECT 'celebrity_mentions', COUNT(*) FROM celebrity_mentions
  UNION ALL
  SELECT 'metrics_cache', COUNT(*) FROM metrics_cache
  UNION ALL
  SELECT 'scraping_jobs', COUNT(*) FROM scraping_jobs;
  ```
- [ ] Compare with pre-migration counts (should match exactly)
- [ ] Check for any errors in MySQL error log
- [ ] Verify application can connect and query
- [ ] Run quick sanity checks

### [ ] 13. Application Restart
- [ ] Restart application server(s)
- [ ] Monitor startup logs for errors
- [ ] Test API endpoints
- [ ] Verify health check: `curl http://localhost:5000/health`
- [ ] Test key endpoints manually
- [ ] Monitor error logs for issues
- [ ] Verify metrics calculations work

### [ ] 14. Disaster Recovery Test
- [ ] Run backup-restore-test.sh to verify:
  ```bash
  bash scripts/backup-restore-test.sh
  ```
- [ ] Verify test completes successfully
- [ ] Confirm "BACKUP VERIFICATION PASSED"
- [ ] Document test results
- [ ] Store test output in logs

---

## POST-DEPLOYMENT PHASE

### [ ] 15. Monitoring Setup
- [ ] Configure cron jobs for automated tasks:
  ```bash
  # Daily backups
  0 2 * * * bash /path/to/scripts/backup-db.sh

  # Weekly optimization
  0 3 * * 0 bash /path/to/scripts/optimize-tables.sh

  # Weekly growth check
  0 4 * * 1 bash /path/to/scripts/check-table-growth.sh

  # Monthly restore test
  0 3 1 * * bash /path/to/scripts/backup-restore-test.sh
  ```
- [ ] Verify cron jobs are scheduled
- [ ] Set up log rotation for cron outputs
- [ ] Configure email alerts for failures
- [ ] Document cron job locations

### [ ] 16. Performance Monitoring
- [ ] Enable slow query log (if not already)
- [ ] Set long_query_time = 2 seconds
- [ ] Monitor query performance daily
- [ ] Check index usage patterns
- [ ] Document slow queries found
- [ ] Create performance baseline

### [ ] 17. Growth Monitoring
- [ ] Run check-table-growth.sh weekly:
  ```bash
  bash scripts/check-table-growth.sh
  ```
- [ ] Monitor database size trend
- [ ] Track row count growth
- [ ] Document growth rate
- [ ] Alert if exceeds thresholds

### [ ] 18. Documentation Updates
- [ ] Update team wiki/docs with new schema
- [ ] Document all new scripts and their usage
- [ ] Add deployment procedure to runbook
- [ ] Update system architecture diagrams
- [ ] Document cron job schedule
- [ ] Create troubleshooting guide

### [ ] 19. Team Training
- [ ] Brief team on schema changes
- [ ] Explain new monitoring scripts
- [ ] Train on backup/restore procedures
- [ ] Document new CHECK constraints
- [ ] Explain DECIMAL precision improvements
- [ ] Train on growth monitoring

### [ ] 20. Rollback Plan (Keep Ready)
- [ ] Keep production backup accessible
- [ ] Document rollback procedure:
  ```bash
  # Restore from backup
  bash scripts/restore-db.sh /path/to/backup_before_v2.sql.gz
  ```
- [ ] Have rollback script ready
- [ ] Test rollback on staging
- [ ] Document rollback duration estimate
- [ ] Keep team informed of rollback capability

---

## FIRST WEEK MONITORING

### [ ] 21. Daily Checks (First 7 Days)
- [ ] Check error logs each morning
- [ ] Verify backups completed successfully
- [ ] Monitor query performance
- [ ] Check database size growth
- [ ] Verify all constraints are working
- [ ] Monitor application metrics
- [ ] Check for any slow queries
- [ ] Review system resources (CPU, memory, disk)

### [ ] 22. First Weekly Tasks
- [ ] Run backup-restore-test.sh (verify restore works)
- [ ] Run check-table-growth.sh (verify growth monitoring)
- [ ] Run optimize-tables.sh (defragment)
- [ ] Review slow query logs
- [ ] Check constraint violations
- [ ] Update team on status
- [ ] Document any issues

### [ ] 23. Performance Validation
- [ ] Compare query times to baseline
- [ ] Verify 50-70% speed improvement expected
- [ ] Check index selectivity
- [ ] Monitor disk I/O
- [ ] Verify no lock contentions
- [ ] Test full-text search
- [ ] Validate composite indexes
- [ ] Document actual improvements

---

## ONGOING MAINTENANCE

### [ ] 24. Weekly Tasks
- [ ] Run check-table-growth.sh (growth monitoring)
- [ ] Monitor backup completion
- [ ] Review slow query logs
- [ ] Check available disk space
- [ ] Verify cron jobs running

### [ ] 25. Monthly Tasks
- [ ] Run backup-restore-test.sh (disaster recovery test)
- [ ] Run optimize-tables.sh (table maintenance)
- [ ] Review growth trends
- [ ] Analyze query patterns
- [ ] Plan capacity for next 3 months
- [ ] Update documentation

### [ ] 26. Quarterly Tasks
- [ ] Review performance metrics
- [ ] Plan for 5x growth if needed
- [ ] Evaluate archival strategy
- [ ] Consider index optimization
- [ ] Update capacity forecast
- [ ] Review backup strategy

### [ ] 27. Annual Tasks
- [ ] Full disaster recovery drill
- [ ] Performance analysis and tuning
- [ ] Plan for year-ahead growth
- [ ] Review and update all scripts
- [ ] Audit security settings
- [ ] Plan technology upgrades

---

## CONTINGENCY PROCEDURES

### [ ] 28. If Migration Fails
1. STOP immediately - do not continue
2. Restore from backup: `bash scripts/restore-db.sh backup_before_migration.sql.gz`
3. Verify application still works
4. Contact DBA team
5. Document issue details
6. Review error logs
7. Fix issue in test environment
8. Schedule retry after resolution

### [ ] 29. If Errors Detected Post-Deployment
1. Check error log: `/var/log/mysql/error.log`
2. Run diagnostic: `bash scripts/backup-restore-test.sh`
3. Verify backup integrity
4. Check constraint violations
5. Review slow query log
6. Contact DBA if unresolved
7. Document issue
8. Plan fix for next maintenance window

### [ ] 30. If Data Loss Suspected
1. STOP immediately
2. Do NOT make any changes
3. Preserve database state
4. Create emergency backup
5. Contact senior DBA
6. Document what happened
7. Investigate data discrepancies
8. Restore from known-good backup if necessary

---

## SUCCESS CRITERIA

✅ **Deployment is successful when:**

- [ ] All migration SQL completes without errors
- [ ] Row counts match pre-migration exactly
- [ ] All tables and constraints exist
- [ ] backup-restore-test.sh passes
- [ ] Application starts without errors
- [ ] All API endpoints work
- [ ] Backup/restore procedures work
- [ ] No errors in application or database logs
- [ ] Query performance meets expectations
- [ ] Team confirms no issues in first week

---

## SIGN-OFF

**Deployment Manager**: ________________
**Date**: ________________
**Time**: ________________

**DBA Approval**: ________________
**Date**: ________________

**Team Lead Approval**: ________________
**Date**: ________________

---

## POST-DEPLOYMENT NOTES

_Use this section to document any issues, decisions, or notes from deployment:_

```
[Add notes here during/after deployment]




```

---

## ROLLBACK INFORMATION

If rollback becomes necessary:

**Backup Location**: `/path/to/backup_before_v2_migration.sql.gz`
**Rollback Command**: `bash scripts/restore-db.sh /path/to/backup_before_v2_migration.sql.gz`
**Estimated Duration**: 5-10 minutes
**Data Loss**: None (restores to pre-migration state)

**Contact**: [Database Admin Name] - [Phone/Email]

---

**Document Version**: 1.0
**Last Updated**: November 11, 2025
**Next Review**: After first successful deployment
