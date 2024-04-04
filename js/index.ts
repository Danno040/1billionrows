import { openSync, read } from 'node:fs'

interface Result {
  dangle: string,
  done: boolean,
}

class Stats {
  public min: number
  public max: number
  public sum: number
  public count: number

  constructor(initialValue: number) {
    this.min = initialValue
    this.max = initialValue
    this.sum = initialValue
    this.count = 1
  }

  public update(value: number) {
    if (this.min > value) {
      this.min = value
    } else if(this.max < value) {
      this.max = value
    }

    this.sum += value
    this.count += 1
  }

  public avg() {
    return this.sum / this.count
  }

  public toString() {
    return `${this.min}/${this.max}/${this.avg()}`
  }
}

const file = openSync('../data/measurements.txt', 'r')

const tempMap: Map<string, Stats> = new Map()
let rowsProcessed = 0

function handleFileData(buffer: ArrayBufferView, dangle: string): string {
  const lines = dangle.concat(buffer.toString()).split('\n')
  const lastLine = lines.pop()
  for(const line of lines) {
    const [city, temp] = line.split(';')
    if (tempMap.has(city)) {
      tempMap.get(city)?.update(parseFloat(temp))
    } else {
      tempMap.set(city, new Stats(parseFloat(temp)))
    }
    rowsProcessed += 1
  }
  return lastLine ?? ''
}

async function readPromise(file: number, dangle: string): Promise<Result> {
  return new Promise((resolve, reject) => {
    read(file, (err: ErrnoException | null, bytesRead: number, buffer: ArrayBufferView) => {
      if (err !== null) {
        reject(err)
      }

      const newDangle = handleFileData(buffer, dangle)
      if (bytesRead === 0) {
        resolve({
          dangle: '',
          done: true,
        })
        return
      }
      resolve({
        dangle: newDangle,
        done: false,
      })
    })
  })
}

let dangle = ''
let done = false
do {
  const result = await readPromise(file, dangle)
  if (rowsProcessed % 10000 === 0) {
    console.log("Rows processed: ", rowsProcessed)
    console.log("Keys: ", tempMap.size)
  }
  dangle = result.dangle
  done = result.done
} while (!done);

console.log("Done. Processed: ", rowsProcessed)
console.log("Results:")

for(const city of [...tempMap.keys()].toSorted()) {
  console.log(city, ": ", tempMap.get(city)?.toString())
}