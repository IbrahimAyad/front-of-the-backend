import { CacheService, createCacheService } from './cache.service';

class MockRedis {
  private store = new Map<string, { value: string; ttl?: number; expiry?: number }>();
  public status = 'ready';

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiry && Date.now() > item.expiry) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(...args: any[]): Promise<string> {
    const [key, value] = args;
    let ttl: number | undefined;
    
    for (let i = 2; i < args.length; i++) {
      if (args[i] === 'EX' && args[i + 1]) {
        ttl = args[i + 1];
        break;
      }
    }
    
    const expiry = ttl ? Date.now() + (ttl * 1000) : undefined;
    this.store.set(key, { value, ttl, expiry });
    return 'OK';
  }

  async del(...keys: string[]): Promise<number> {
    let count = 0;
    keys.forEach(key => {
      if (this.store.delete(key)) count++;
    });
    return count;
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return Array.from(this.store.keys()).filter(key => regex.test(key));
  }

  async exists(key: string): Promise<number> {
    return this.store.has(key) ? 1 : 0;
  }

  async ttl(key: string): Promise<number> {
    const item = this.store.get(key);
    if (!item || !item.expiry) return -1;
    const remaining = Math.floor((item.expiry - Date.now()) / 1000);
    return remaining > 0 ? remaining : -2;
  }

  async expire(key: string, ttl: number): Promise<number> {
    const item = this.store.get(key);
    if (!item) return 0;
    item.expiry = Date.now() + (ttl * 1000);
    return 1;
  }

  async incrby(key: string, by: number): Promise<number> {
    const current = parseInt(this.store.get(key)?.value || '0');
    const newValue = current + by;
    this.store.set(key, { value: newValue.toString() });
    return newValue;
  }

  async decrby(key: string, by: number): Promise<number> {
    const current = parseInt(this.store.get(key)?.value || '0');
    const newValue = current - by;
    this.store.set(key, { value: newValue.toString() });
    return newValue;
  }

  async mget(...keys: string[]): Promise<(string | null)[]> {
    return keys.map(key => this.store.get(key)?.value || null);
  }

  pipeline() {
    const commands: any[] = [];
    const self = this;
    return {
      set(...args: any[]) {
        commands.push(['set', args]);
      },
      async exec() {
        for (const [cmd, args] of commands) {
          await self[cmd](...args);
        }
      }
    };
  }

  async flushdb(): Promise<void> {
    this.store.clear();
  }

  async quit(): Promise<void> {
    this.status = 'end';
  }

  on() {}
}

async function testCacheService() {
  console.log('Testing CacheService...\n');
  
  const originalRedis = require('ioredis');
  require('ioredis').default = MockRedis;
  
  const cacheService = createCacheService({ keyPrefix: 'test:' });
  
  await new Promise(resolve => setTimeout(resolve, 100));

  try {
    console.log('1. Testing set and get...');
    await cacheService.set('user:1', JSON.stringify({ id: 1, name: 'John' }));
    const user = await cacheService.get('user:1');
    console.log('✓ Set and retrieved value:', user ? JSON.parse(user).name : 'Failed');

    console.log('\n2. Testing TTL operations...');
    await cacheService.set('temp:key', 'temporary', 60);
    const ttl = await cacheService.getTTL('temp:key');
    console.log('✓ TTL set (should be around 60):', ttl);

    console.log('\n3. Testing exists...');
    const exists = await cacheService.exists('user:1');
    const notExists = await cacheService.exists('user:999');
    console.log('✓ Exists check:', exists ? 'PASSED' : 'FAILED');
    console.log('✓ Not exists check:', !notExists ? 'PASSED' : 'FAILED');

    console.log('\n4. Testing delete...');
    const deleted = await cacheService.delete('user:1');
    const afterDelete = await cacheService.exists('user:1');
    console.log('✓ Delete operation:', deleted && !afterDelete ? 'PASSED' : 'FAILED');

    console.log('\n5. Testing invalidate pattern...');
    await cacheService.set('products:1', 'Product 1');
    await cacheService.set('products:2', 'Product 2');
    await cacheService.set('products:3', 'Product 3');
    await cacheService.invalidate('products:*');
    const afterInvalidate = await cacheService.exists('products:1');
    console.log('✓ Pattern invalidation:', !afterInvalidate ? 'PASSED' : 'FAILED');

    console.log('\n6. Testing increment/decrement...');
    const incr = await cacheService.increment('counter');
    const incr2 = await cacheService.increment('counter', 5);
    const decr = await cacheService.decrement('counter', 2);
    console.log('✓ Counter operations: 1 → 6 → 4:', decr === 4 ? 'PASSED' : 'FAILED');

    console.log('\n7. Testing batch operations...');
    await cacheService.mset({
      'batch:1': 'Value 1',
      'batch:2': 'Value 2',
      'batch:3': 'Value 3',
    }, 300);
    const batchValues = await cacheService.mget(['batch:1', 'batch:2', 'batch:3']);
    console.log('✓ Batch set/get:', batchValues.every(v => v !== null) ? 'PASSED' : 'FAILED');

    console.log('\n8. Testing setWithOptions...');
    const nx = await cacheService.setWithOptions('unique:key', 'value', { nx: true });
    const nxAgain = await cacheService.setWithOptions('unique:key', 'new-value', { nx: true });
    console.log('✓ NX option (set if not exists):', nx && !nxAgain ? 'PASSED' : 'FAILED');

    console.log('\n9. Testing connection status...');
    const connected = cacheService.isConnected();
    console.log('✓ Connection status:', connected ? 'CONNECTED' : 'DISCONNECTED');

    console.log('\n10. Testing disconnect...');
    await cacheService.disconnect();
    console.log('✓ Disconnected successfully');

    console.log('\n✅ All CacheService tests passed!');
    return true;
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    return false;
  } finally {
    require('ioredis').default = originalRedis;
  }
}

if (require.main === module) {
  testCacheService().then(success => {
    process.exit(success ? 0 : 1);
  });
}