# ⚡ Executing Loop Activators

Class: `com.ssomar.score.events.loop.LoopManager`

## Registering new Loop Activators

Reference: `com.ssomar.executableevents.events.EventsManager`

```java
    @Override
    public void save(ConfigurationSection config) {
        ConfigurationSection attributeConfig = config.createSection(getId());

        /* Add the activator to the LOOP Manager if its a LOOP activator and if it is not present (new activator) */
        if (optionFeature.getValue().isLoopOption()) {
            SsomarDev.testMsg("delay >> " + loopFeatures.getDelay().getValue().get(), true);
            LoopManager.getInstance(ExecutableEvents.plugin.getPlugin()).addLoopActivator(this);
        } else LoopManager.getInstance(ExecutableEvents.plugin.getPlugin()).removeLoopActivator(this);

        OptimizedEventsHandler.getInstance().read(optionFeature.getValue());

        for (FeatureInterface feature : getFeatures()) {
            feature.save(attributeConfig);
        }
    }
```
> A loop activator is registered to the LoopManager

Reference: `com.ssomar.score.events.loop.LoopManager#addLoopActivator`

```java
    public void addLoopActivator(SActivator activator) {
        if (activator == null) return;

        loopActivatorsToAdd.add(activator);
    }
```

## Running Loop Activators (Incomplete)

Reference: `com.ssomar.score.events.loop.LoopManager#runLoop`

```mermaid
flowchart TD
    creationOfRunnable["Creation of <code>Runnable</code> object"]
    -->
    createActivateRemoveLists["Initialize <code>toActivate</code> and <code>toRemove</code> ArrayLists"]
    -->
    addActivatorsToTheRemoveList["Add the <code>loopActivatorsToAdd</code> and <code>loopActivatorsToRemove</code> Activators to the <code>toRemoveList</code>
    <hr/>
    <code>loopActivatorsToAdd</code> is populated via <code>addLoopActivator()</code> and <code>loopActivatorsToRemove</code> is populated via <code>removeLoopActivator()</code>
    <br/>
    "]
    -->
    storeLoopActivatorsInAnIterator["Store the <code>loopActivators</code> in an Iterator obj"]
    --> SActivatorIteration

    subgraph SActivatorIteration
        getNextIteration["Get next SActivator "]
    end
```