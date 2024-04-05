use std::{collections::HashMap, fs::File, io::{BufRead, BufReader}};

#[derive(Debug)]
struct Stats {
    min: f64,
    max: f64,
    sum: f64,
    count: u32,
}

impl Default for Stats {
    fn default() -> Self {
        Self { 
            min: f64::INFINITY, 
            max: f64::NEG_INFINITY, 
            sum: Default::default(), 
            count: Default::default()
        }
    }
}

fn main() {
    // Create data structure for holding our info:
    let mut data = HashMap::new();
    let f = File::open("../data/measurements.txt").unwrap();
    let f = BufReader::new(f);

    let mut count: u32 = 0;
    for line in f.lines().flatten() {
        if count.wrapping_rem(1_000_000) == 0 {
            println!("@{count}")
        }
        let (city, temp) = if let Some((city, temp)) = line.split_once(';') {
            (city, temp.parse::<f64>().unwrap())
        } else {
            continue
        };
        
        let entry = data.entry(city.to_string()).or_insert(Stats::default());

        entry.count += 1;
        entry.sum += temp;
        entry.max = temp.max(entry.max);
        entry.min = temp.min(entry.min);
        count += 1;
    }

    let mut data = data.into_iter().collect::<Vec<_>>();
    data.sort_unstable_by_key(|(key, _)| key.to_string() );

    for (city, stats) in data {
        let avg = stats.sum / f64::from(stats.count);
        println!("{city}: {}/{}/{} count = {}", stats.min, stats.max, avg, stats.count);
    }
}
